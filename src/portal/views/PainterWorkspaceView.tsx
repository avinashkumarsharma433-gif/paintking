import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard } from '../types/portalTypes';
import { 
  Paintbrush, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  Send, 
  User, 
  Flame, 
  ShieldCheck, 
  RotateCcw,
  Check,
  Plus,
  Minus,
  CheckCircle,
  FileText,
  Users,
  Settings
} from 'lucide-react';

export const PainterWorkspaceView: React.FC = () => {
  const { 
    jobCards, 
    painters, 
    currentUser,
    activeSubTab,
    setActiveSubTab,
    startPainterJob, 
    markPainterJobFinished, 
    verifyAndAcceptJob,
    rejectAndRequestRework,
    updateJobCardSprayed,
    getPainterActiveJobCount,
    getPainterPerformanceStats,
    pendingVerificationJobsCount 
  } = usePortalStore();

  const isManager = currentUser.role !== 'OPERATOR';

  // For individual painter login (OPERATOR role)
  const loggedInPainter = painters.find(p => 
    p.name.toLowerCase().includes(currentUser.name.toLowerCase()) || 
    currentUser.name.toLowerCase().includes(p.name.toLowerCase())
  ) || painters[0];

  // If manager, allow switching between painters or viewing all
  const [selectedPainterId, setSelectedPainterId] = useState<string>(() => {
    if (!isManager && loggedInPainter) {
      return loggedInPainter.id;
    }
    return painters[0]?.id || 'ptr_1';
  });

  // Modal state for viewing painter SLA breakdown
  const [selectedPainterForSlaModal, setSelectedPainterForSlaModal] = useState<any | null>(null);

  // When persona switches from header, auto update selected painter
  useEffect(() => {
    if (!isManager && loggedInPainter) {
      setSelectedPainterId(loggedInPainter.id);
    }
  }, [currentUser, isManager, loggedInPainter]);

  const activeTargetPainter = isManager 
    ? (painters.find(p => p.id === selectedPainterId) || painters[0])
    : loggedInPainter;

  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  // Synchronize with sidebar subTab
  useEffect(() => {
    if (activeSubTab === 'COMPLETED' || activeSubTab === 'PENDING') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleSelectTab = (tab: 'PENDING' | 'COMPLETED') => {
    setActiveTab(tab);
    setActiveSubTab(tab);
  };

  const [painterNotesMap, setPainterNotesMap] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter jobs strictly assigned to the target painter
  const activePainterJobs = jobCards.filter(jc => {
    const assigned = (jc.assignedPainterName || jc.painterName || '').trim().toLowerCase();
    const targetName = (activeTargetPainter?.name || '').trim().toLowerCase();
    const isMatching = assigned.includes(targetName) || targetName.includes(assigned);
    const isJobActive = jc.status !== 'Completed' && jc.status !== 'Closed' && jc.painterJobStatus !== 'Verified & Accepted';
    return isMatching && isJobActive;
  });

  const completedPainterJobs = jobCards.filter(jc => {
    const assigned = (jc.assignedPainterName || jc.painterName || '').trim().toLowerCase();
    const targetName = (activeTargetPainter?.name || '').trim().toLowerCase();
    const isMatching = assigned.includes(targetName) || targetName.includes(assigned);
    return isMatching && (jc.status === 'Completed' || jc.painterJobStatus === 'Verified & Accepted');
  });

  const handleStartJob = (jobCardNo: string) => {
    startPainterJob(jobCardNo, activeTargetPainter.name);
    showToast(`Job ${jobCardNo} started! Booth spraying timer is live.`);
  };

  const handleAddSprayed = (jobCardNo: string, amount: number) => {
    updateJobCardSprayed(jobCardNo, amount, 0);
    showToast(`Added +${amount} sprayed pieces to ${jobCardNo}`);
  };

  const handleFinishJob = (jobCardNo: string) => {
    const notes = painterNotesMap[jobCardNo] || 'Spraying & curing completed. Handed over for floor verification.';
    markPainterJobFinished(jobCardNo, notes);
    showToast(`✓ Job ${jobCardNo} marked as Finished! Sent to Production Manager for floor verification.`);
  };

  const handleVerifyJob = (jobCardNo: string) => {
    verifyAndAcceptJob(jobCardNo, currentUser.name, 'Approved & verified on shop floor by Production Manager');
    showToast(`✓ Job ${jobCardNo} verified and accepted! Painter booth slot freed.`);
  };

  const handleReworkJob = (jobCardNo: string) => {
    rejectAndRequestRework(jobCardNo, 'Defect observed: Requires de-nibbing and clear lacquer re-spray.');
    showToast(`⚠️ Job ${jobCardNo} routed back for floor rework.`);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const activeCount = activePainterJobs.length;
  const loggedInPainterStats = getPainterPerformanceStats(loggedInPainter.name);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ====================================================================== */}
      {/* 1. TOP HEADER BANNER                                                   */}
      {/* ====================================================================== */}
      {isManager ? (
        /* MANAGER HEADER (Production Supervisor / Plant Head) */
        <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#c09748]" />
                PRODUCTION MANAGER FLOOR OVERSIGHT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-semibold">
                👤 {currentUser.name} ({currentUser.roleTitle})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                {painters.length} Spray Booths Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
              Painter Floor Desk & SLA Governance
            </h1>
            <p className="text-xs text-[#777b86] mt-1">
              Floor painters ki live capacity (Max 2 jobs rule), SLA On-Time compliance aur completion records ka complete floor oversight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
              Max 2 Jobs / Painter Rule Enforced
            </span>
          </div>
        </div>
      ) : (
        /* INDIVIDUAL PAINTER DEDICATED BANNER (Clean, Only His Identity) */
        <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={loggedInPainter.avatar} 
                alt={loggedInPainter.name} 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#c09748] shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#17191c] text-[#c09748] text-[10px] font-mono font-bold border border-[#f4e5be]">
                {loggedInPainter.code}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Paintbrush className="w-3 h-3 text-[#c09748]" />
                  MY SPRAY WORKSTATION
                </span>
                <span className="text-[10px] text-[#777b86] font-mono">
                  {loggedInPainter.shift}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-normal text-[#17191c] tracking-tight">
                {loggedInPainter.name}
              </h1>
              <div className="text-xs text-[#777b86] mt-0.5 flex flex-wrap items-center gap-2">
                <span>{loggedInPainter.boothNo}</span>
                <span className="text-gray-300">•</span>
                <span className="text-[#8a6521] font-semibold">{loggedInPainter.specialization}</span>
              </div>
            </div>
          </div>

          {/* Live Workload Capacity & SLA Scorecard Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 p-3 px-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] shadow-2xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#777b86]">Current Workload</div>
                <div className="text-sm font-bold text-[#17191c] flex items-center gap-1.5 font-mono mt-0.5">
                  <span>{activeCount}/2 Active Jobs</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                activeCount >= 2 
                  ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                  : activeCount === 1 
                  ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {activeCount >= 2 ? '🔴 Cap Reached' : `🟢 ${2 - activeCount} Slot Open`}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] shadow-2xs">
              {loggedInPainterStats.hasDelayedJobs ? (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-800 block">SLA Compliance Mark</span>
                    <strong className="text-xs text-rose-900">{loggedInPainterStats.delayedJobs} Job Time Se Late ⚠️</strong>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">SLA Compliance Record</span>
                    <strong className="text-xs text-emerald-900">⭐ 100% On-Time Record ({loggedInPainterStats.onTimeJobs} Jobs)</strong>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedPainterForSlaModal(loggedInPainter)}
                className="ml-2 text-[10px] font-bold text-[#8a6521] hover:underline cursor-pointer"
              >
                Log →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-[16px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2. OPERATOR ON-TIME VS DELAYED JOB TRACKING DESK (FLOOR FLEET)        */}
      {/* ====================================================================== */}
      {isManager && (
        <div className="space-y-4 bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c09748]" />
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                  Floor Painters SLA & On-Time Performance Profile
                </span>
              </div>
              <h2 className="font-serif font-normal text-base sm:text-lg text-[#17191c] mt-0.5">
                Operator On-Time vs Delayed Job Tracking Desk
              </h2>
            </div>
            <span className="text-xs text-[#777b86]">
              Job Cards must close within assigned SLA limit or profile receives a <strong>Delayed Mark ⚠️</strong>.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {painters.map(p => {
              const count = getPainterActiveJobCount(p.name);
              const isSelected = p.id === selectedPainterId;
              const stats = getPainterPerformanceStats(p.name);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPainterId(p.id)}
                  className={`p-4 rounded-[20px] border transition flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-[#c09748] bg-[#faf7ed] ring-2 ring-[#c09748]/30 shadow-xs'
                      : stats.hasDelayedJobs
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-400 shadow-2xs'
                      : 'border-[#ececec] bg-white hover:border-[#c09748]/50 hover:bg-[#fafafb]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#c09748] shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#17191c] truncate">{p.name}</h4>
                          <span className="text-[10px] text-[#777b86] font-mono block truncate">
                            {p.code} • {p.boothNo.split('(')[0]}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        count === 0 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : count === 1 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {count}/2 Slots
                      </span>
                    </div>

                    {/* Official Profile On-Time / Delayed Status Badge */}
                    <div className="pt-1">
                      {stats.hasDelayedJobs ? (
                        <div className="p-2 rounded-[12px] bg-rose-50 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1 truncate">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>⚠️ {stats.delayedJobs} Job Time Se Nahi Hua</span>
                          </span>
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                            Delayed
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>⭐ 100% On-Time Record</span>
                          </span>
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                            {stats.onTimeJobs} OK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Performance Progress & Metric Pills */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono pt-1">
                      <div className="bg-white p-1.5 rounded-[10px] border border-[#ececec] text-emerald-800">
                        <span className="text-[9px] text-[#777b86] uppercase block font-sans">Time Se Kiye</span>
                        <strong>{stats.onTimeJobs} Jobs ✓</strong>
                      </div>
                      <div className={`p-1.5 rounded-[10px] border ${stats.delayedJobs > 0 ? 'bg-rose-100/60 border-rose-200 text-rose-800' : 'bg-white border-[#ececec] text-gray-500'}`}>
                        <span className="text-[9px] text-[#777b86] uppercase block font-sans">Time Se Late</span>
                        <strong>{stats.delayedJobs} Jobs ⚠️</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#ececec]/60 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] text-[#8a6521] font-semibold">
                      {isSelected ? '✓ Active in Floor Queue' : 'Click to inspect queue'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPainterForSlaModal(p);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-gray-50 text-[#17191c] border border-[#ececec] hover:border-[#c09748] text-[10.5px] font-semibold transition cursor-pointer shadow-2xs"
                    >
                      SLA Log →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 3. TABS: PENDING WORK vs COMPLETED WORK                                */}
      {/* ====================================================================== */}
      <div className="flex items-center gap-2 border-b border-[#ececec] pb-3">
        <button
          onClick={() => handleSelectTab('PENDING')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {isManager ? `${activeTargetPainter.name.split(' ')[0]}'s Pending Work` : 'My Pending Work'} ({activeCount} Active / Max 2)
          </span>
        </button>

        <button
          onClick={() => handleSelectTab('COMPLETED')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'COMPLETED'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isManager ? `${activeTargetPainter.name.split(' ')[0]}'s Completed History` : 'My Completed Work'} ({completedPainterJobs.length} Verified)
          </span>
        </button>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: PENDING WORK QUEUE (MAX 2 JOBS)                                 */}
      {/* ====================================================================== */}
      {activeTab === 'PENDING' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-serif font-semibold text-[#17191c]">
              Pending Job Cards Assigned to {activeTargetPainter.name} ({activeTargetPainter.boothNo})
            </h2>
            <span className="text-xs text-[#777b86]">
              Maximum 2 Job Cards capacity at any time
            </span>
          </div>

          {activePainterJobs.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-[24px] bg-white border border-[#ececec] text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#c09748] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#17191c]">
                No Pending Job Cards Assigned
              </h3>
              <p className="text-xs text-[#777b86] max-w-md mx-auto">
                {isManager 
                  ? `${activeTargetPainter.name} ke booth par abhi koi active job assigned nahi hai. Aap Job Cards & Batches se isko maximum 2 jobs assign kar sakte hain.`
                  : 'Aapke booth par abhi koi pending kaam nahi hai. Production Manager naya Job Card create karke aapko assign karega (Max 2 jobs).'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {activePainterJobs.map((jc, index) => {
                const status = jc.painterJobStatus || (jc.sprayedQty > 0 ? 'In Progress' : 'Assigned');
                const isFinishedPendingReview = status === 'Pending Verification' || status === 'Painter Finished (Pending Review)';
                const isInProgress = status === 'In Progress';
                const isAssignedNotStarted = status === 'Assigned' || !jc.painterJobStatus;
                const isRework = status === 'Rework Requested';
                const progressPct = Math.min(100, Math.round((jc.sprayedQty / jc.targetQty) * 100));

                return (
                  <div 
                    key={jc.jobCardNo}
                    className={`p-5 sm:p-6 rounded-[24px] border transition shadow-sm space-y-4 ${
                      isFinishedPendingReview 
                        ? 'bg-amber-50/40 border-amber-300' 
                        : isRework 
                        ? 'bg-red-50/40 border-red-300' 
                        : 'bg-white border-[#ececec] hover:border-[#c09748]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#c09748] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                            Slot #{index + 1} • {jc.jobCardNo}
                          </span>
                          <span className="text-[10px] font-mono text-[#777b86]">
                            WO: {jc.woNo || jc.wNo || 'WO-1042'}
                          </span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-[#17191c] mt-1.5">
                          {jc.partDescription}
                        </h3>
                        <p className="text-xs text-[#777b86]">
                          {jc.customer} • Shade: <strong className="text-[#8a6521]">{jc.color || 'Standard'}</strong>
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight shrink-0 ${
                        isFinishedPendingReview 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                          : isInProgress 
                          ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                          : isRework 
                          ? 'bg-red-100 text-red-900 border border-red-200' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status}
                      </span>
                    </div>

                    {/* Target & Quantity Stats */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-center">
                      <div>
                        <span className="text-[10px] font-bold text-[#777b86] uppercase block">Target Batch</span>
                        <strong className="text-base font-serif text-[#17191c] font-bold">
                          {jc.targetQty} pcs
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#777b86] uppercase block">Sprayed Output</span>
                        <strong className="text-base font-serif text-emerald-700 font-bold">
                          {jc.sprayedQty} pcs
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#777b86] uppercase block">Balance Left</span>
                        <strong className="text-base font-serif text-[#c09748] font-normal">
                          {Math.max(0, jc.targetQty - jc.sprayedQty)} pcs
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-[#777b86]">
                        <span>Batch Progress: <strong>{progressPct}%</strong></span>
                        <span>Good: <strong>{jc.goodQty}</strong> | Rejection: <strong className="text-red-600">{jc.rejectQty}</strong></span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            progressPct >= 100 ? 'bg-emerald-600' : 'bg-[#c09748]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 3-Stage Process Status Chips */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono border border-[#ececec] rounded-[12px] p-2 bg-[#fafafb]">
                      <div className="border-r border-[#ececec]">
                        <span className="text-[#777b86] block">1. Base Coat</span>
                        <span className="font-bold text-emerald-800">
                          {jc.stageProcessFirst?.okQty || jc.goodQty || 0} OK
                        </span>
                      </div>
                      <div className="border-r border-[#ececec]">
                        <span className="text-[#777b86] block">2. Dipping/UV</span>
                        <span className="font-bold text-emerald-800">
                          {jc.stageProcessSecond?.okQty || jc.goodQty || 0} OK
                        </span>
                      </div>
                      <div>
                        <span className="text-[#777b86] block">3. Clear Lacquer</span>
                        <span className="font-bold text-emerald-800">
                          {jc.stageProcessThird?.okQty || jc.goodQty || 0} OK
                        </span>
                      </div>
                    </div>

                    {/* INTERACTIVE ACTIONS */}
                    <div className="pt-2 border-t border-[#ececec] space-y-3">
                      {isAssignedNotStarted && (
                        <button
                          onClick={() => handleStartJob(jc.jobCardNo)}
                          className="w-full py-3 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                        >
                          <Play className="w-4 h-4 fill-[#c09748]" />
                          <span>▶ Start Spraying / Kaam Shuru Karo</span>
                        </button>
                      )}

                      {isInProgress && (
                        <div className="space-y-3">
                          {/* Quick Increment Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#fafafb] rounded-[14px] border border-[#ececec]">
                            <span className="text-xs font-bold text-[#17191c]">Log Sprayed Output:</span>
                            <div className="flex items-center gap-1.5">
                              {[10, 25, 50, 100].map(qty => (
                                <button
                                  key={qty}
                                  type="button"
                                  onClick={() => handleAddSprayed(jc.jobCardNo, qty)}
                                  className="px-2.5 py-1 rounded-full bg-white hover:bg-gray-100 text-[#17191c] text-xs font-mono font-bold border border-[#ececec] cursor-pointer shadow-2xs transition active:scale-95"
                                >
                                  +{qty}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Painter Notes */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#777b86] mb-1">
                              Booth Operator Notes / Finishing Remarks:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2 coats applied, viscosity 14.5s Ford 4, zero dust nibs observed."
                              value={painterNotesMap[jc.jobCardNo] || ''}
                              onChange={e => setPainterNotesMap({ ...painterNotesMap, [jc.jobCardNo]: e.target.value })}
                              className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                            />
                          </div>

                          {/* Mark Finished Button */}
                          <button
                            onClick={() => handleFinishJob(jc.jobCardNo)}
                            className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ Mark as Finished / Kaam Ho Gaya (Submit for Verification)</span>
                          </button>
                        </div>
                      )}

                      {isFinishedPendingReview && (
                        <div className="p-3.5 bg-amber-100/70 rounded-[16px] border border-amber-300 text-center text-xs text-amber-900 space-y-2">
                          <div className="font-bold flex items-center justify-center gap-1.5 text-amber-900">
                            <Clock className="w-4 h-4 text-amber-700" />
                            Work Finished & Awaiting Manager Verification
                          </div>
                          <p className="text-[11px] text-amber-800">
                            {isManager 
                              ? "Aap Production Manager hain. Physical check karke niche diye gaye button se verify ya rework request karein:"
                              : "Production Manager floor par aakar physical quality check karega aur verify karega."
                            }
                          </p>

                          {/* Manager Quick Action if manager is viewing */}
                          {isManager && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200">
                              <button
                                type="button"
                                onClick={() => handleReworkJob(jc.jobCardNo)}
                                className="py-2 px-3 rounded-full border border-amber-400 bg-white text-amber-900 font-bold text-xs cursor-pointer hover:bg-amber-50"
                              >
                                🔄 Request Rework
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVerifyJob(jc.jobCardNo)}
                                className="py-2 px-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>✓ Accept & Verify</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ====================================================================== */
        /* TAB 2: COMPLETED WORK (VERIFIED BY PRODUCTION MANAGER)                 */
        /* ====================================================================== */
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                  Completed & Verified Work History ({activeTargetPainter.name})
                </h3>
                <p className="text-xs text-[#777b86] mt-0.5">
                  All Job Cards finished by {activeTargetPainter.name} that passed physical inspection and were verified by the Production Manager.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold self-start sm:self-auto">
                {completedPainterJobs.length} Jobs Verified
              </span>
            </div>

            {completedPainterJobs.length === 0 ? (
              <div className="p-8 text-center text-[#777b86] space-y-2">
                <FileText className="w-8 h-8 mx-auto text-gray-300" />
                <div className="font-semibold text-sm text-[#17191c]">No Verified Jobs in History Yet</div>
                <div className="text-xs">Once the Production Manager verifies finished jobs, they will appear in this history list.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedPainterJobs.map(jc => (
                  <div key={jc.jobCardNo} className="p-4 rounded-[18px] bg-white border border-[#ececec] hover:border-[#c09748] transition space-y-2 shadow-2xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#f2f2f3]">
                      <span className="font-mono font-bold text-xs text-[#c09748]">{jc.jobCardNo}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        ✓ PM Verified & Passed
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#17191c]">{jc.partDescription}</div>
                    <div className="text-xs text-[#777b86]">{jc.customer} • Shade: {jc.color || 'Standard'}</div>

                    <div className="p-2 rounded-[12px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between text-xs font-mono mt-1">
                      <span>OK Output: <strong className="text-emerald-700">{jc.goodQty || jc.targetQty} Pcs</strong></span>
                      <span className="text-[#777b86]">Target: {jc.targetQty}</span>
                    </div>

                    {jc.verifiedBy && (
                      <div className="text-[10px] text-[#777b86] pt-1 border-t border-[#ececec]">
                        Verified by: <strong className="text-[#17191c]">{jc.verifiedBy}</strong>
                        {jc.verifiedAt && <span> at {new Date(jc.verifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: PAINTER SLA & ON-TIME PERFORMANCE BREAKDOWN MODAL               */}
      {/* ====================================================================== */}
      {selectedPainterForSlaModal && (() => {
        const painter = selectedPainterForSlaModal;
        const stats = getPainterPerformanceStats(painter.name);
        const painterJobCards = jobCards.filter(
          j => (j.assignedPainterId === painter.id || j.assignedPainterName?.toLowerCase().includes(painter.name.toLowerCase().split(' ')[0]) || j.painterName?.toLowerCase().includes(painter.name.toLowerCase().split(' ')[0]))
        );

        return (
          <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
            {/* Sticky Top Header Bar */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <img
                  src={painter.avatar}
                  alt={painter.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#c09748]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase">
                      {painter.code} • {painter.boothNo}
                    </span>
                    {stats.hasDelayedJobs ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-bold">
                        ⚠️ Profile Marked: Delayed Jobs
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold">
                        ⭐ 100% On-Time Record
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c] mt-0.5">
                    {painter.name} — SLA Performance Desk
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPainterForSlaModal(null)}
                className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
                title="Close"
              >
                <X className="w-5 h-5 text-[#17191c]" />
              </button>
            </div>

            {/* Body Container */}
            <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
              {/* Performance Score Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] shadow-2xs">
                  <span className="text-[10px] text-[#777b86] uppercase font-bold block mb-1">Total Assigned</span>
                  <strong className="font-mono text-lg text-[#17191c]">{stats.totalAssigned} Jobs</strong>
                </div>
                <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] shadow-2xs">
                  <span className="text-[10px] text-[#777b86] uppercase font-bold block mb-1">Active on Floor</span>
                  <strong className="font-mono text-lg text-blue-700">{stats.activeJobs} Jobs ({stats.activeSlotsOccupied}/2 Slots)</strong>
                </div>
                <div className="p-4 rounded-[18px] bg-emerald-50/60 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Time Se Kiye (On-Time)</span>
                  <strong className="font-mono text-lg text-emerald-800">{stats.onTimeJobs} Jobs ✓</strong>
                </div>
                <div className={`p-4 rounded-[18px] border shadow-2xs ${stats.delayedJobs > 0 ? 'bg-rose-50 border-rose-300' : 'bg-[#fafafb] border-[#ececec]'}`}>
                  <span className={`text-[10px] uppercase font-bold block mb-1 ${stats.delayedJobs > 0 ? 'text-rose-800' : 'text-[#777b86]'}`}>
                    Time Se Nahi Hua (Delayed)
                  </span>
                  <strong className={`font-mono text-lg ${stats.delayedJobs > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                    {stats.delayedJobs} Jobs ⚠️
                  </strong>
                </div>
              </div>

              {/* Individual Assigned Jobs Audit List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#17191c] uppercase tracking-wider font-mono">
                  Assigned Job Cards & SLA Audit Trail ({painterJobCards.length})
                </h4>

                {painterJobCards.length === 0 ? (
                  <div className="p-8 text-center text-[#777b86] bg-[#fafafb] rounded-[20px] border border-[#ececec]">
                    No job cards assigned to this painter yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {painterJobCards.map(jc => {
                      const isClosed = jc.status === 'Completed' || jc.status === 'Verified & Accepted' || jc.status === 'Target Met';
                      const isBreached = jc.isSlaBreached || (!isClosed && jc.slaDeadline && new Date() > new Date(jc.slaDeadline));

                      return (
                        <div
                          key={jc.jobCardNo}
                          className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-md text-[11px] border border-[#f4e5be]">
                                {jc.jobCardNo}
                              </span>
                              <span className="font-semibold text-[#17191c] text-sm">{jc.partDescription}</span>
                              <span className="text-[11px] text-[#777b86]">({jc.customer})</span>
                            </div>
                            <div className="text-[11px] text-[#777b86] flex flex-wrap items-center gap-3 font-mono pt-0.5">
                              <span>Target: <strong className="text-[#17191c]">{jc.targetQty} pcs</strong></span>
                              <span>Target SLA: <strong className="text-[#17191c]">{jc.slaHours || 4}h</strong></span>
                              {jc.slaDeadline && (
                                <span>Deadline: <strong>{new Date(jc.slaDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                              )}
                              {jc.closedAt && (
                                <span>Closed At: <strong>{new Date(jc.closedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                            {isClosed ? (
                              jc.isOnTimeCompleted === false || jc.isSlaBreached ? (
                                <span className="px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-bold text-[10px] flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Time Se Nahi Hua (Delayed)</span>
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Time Se Hua ✓</span>
                                </span>
                              )
                            ) : isBreached ? (
                              <span className="px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>⚠️ SLA Breached (Late)</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[10px] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>In Progress (On-Track)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPainterForSlaModal(null)}
                  className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
                >
                  Close SLA Desk
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
