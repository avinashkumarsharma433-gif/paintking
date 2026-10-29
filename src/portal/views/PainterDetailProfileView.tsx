import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  Phone, 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  Award, 
  RotateCcw, 
  FileText, 
  Package,
  ArrowRight
} from 'lucide-react';
import { JobCard, PainterProfile } from '../types/portalTypes';
import { usePortalStore } from '../context/PortalStoreContext';
import { PaintkingDatePicker } from '../components/PaintkingDatePicker';

interface PainterDetailProfileViewProps {
  painter: PainterProfile;
  onBack: () => void;
  onEdit: (painter: PainterProfile) => void;
  onViewJobCard: (jc: JobCard) => void;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'custom';
type StatusFilter = 'all' | 'completed' | 'in_progress' | 'verification_pending' | 'rework';

// Robust date normalizer to standard "YYYY-MM-DD"
const normalizeToDateString = (dateVal?: string): string | null => {
  if (!dateVal) return null;
  const str = dateVal.trim();
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // fallback
  }
  return null;
};

// Formats YYYY-MM-DD or ISO string to standard Indian DD-MM-YYYY
const formatDisplayDate = (dateVal?: string): string => {
  const norm = normalizeToDateString(dateVal);
  if (!norm) return dateVal || '—';
  const [y, m, d] = norm.split('-');
  return `${d}-${m}-${y}`;
};

export const PainterDetailProfileView: React.FC<PainterDetailProfileViewProps> = ({
  painter,
  onBack,
  onEdit,
  onViewJobCard
}) => {
  const { jobCards, getPainterPerformanceStats, getPainterActiveJobCount, canAssignPainter } = usePortalStore();

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Identify all Job Cards belonging to this painter
  const allPainterJobs = useMemo(() => {
    const pName = painter.name.toLowerCase().trim();
    const firstName = pName.split(' ')[0];
    const pCode = painter.code?.toLowerCase().trim();

    return jobCards.filter(jc => {
      const assigned = (jc.assignedPainterName || (jc as any).painterName || '').toLowerCase().trim();
      const assignedId = (jc.assignedPainterId || '').toLowerCase().trim();

      return (
        assignedId === painter.id.toLowerCase() ||
        (pCode && (assigned.includes(pCode) || assignedId === pCode)) ||
        assigned === pName ||
        assigned.includes(pName) ||
        (firstName && assigned.includes(firstName))
      );
    });
  }, [jobCards, painter]);

  // General painter stats
  const activeJobsCount = getPainterActiveJobCount(painter.name);
  const isCapped = !canAssignPainter(painter.name);
  const perfStats = getPainterPerformanceStats(painter.id);

  // Helper to determine the relevant date for a job card
  const getJobEffectiveDate = (jc: JobCard): string | null => {
    // Completed date takes precedence for finished jobs
    if (jc.status === 'Completed' || jc.painterJobStatus === 'Verified & Accepted') {
      const finish = jc.closedAt || jc.verifiedAt || jc.painterFinishedAt;
      if (finish) return normalizeToDateString(finish);
    }
    // Fallback to start / issue date
    return normalizeToDateString(jc.issueDate || jc.createdAt || jc.revDate);
  };

  // Helper to determine completion date specifically
  const getJobCompletionDate = (jc: JobCard): string | null => {
    const finish = jc.closedAt || jc.verifiedAt || jc.painterFinishedAt;
    if (finish) return normalizeToDateString(finish);
    if (jc.status === 'Completed') {
      return normalizeToDateString(jc.issueDate);
    }
    return null;
  };

  // 2. Filter jobs based on Date Preset, Custom Dates, Status, and Search Query
  const filteredJobs = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compute preset date boundaries
    let filterStart: string | null = null;
    let filterEnd: string | null = null;

    if (datePreset === 'today') {
      filterStart = todayStr;
      filterEnd = todayStr;
    } else if (datePreset === 'yesterday') {
      const yDate = new Date(today);
      yDate.setDate(today.getDate() - 1);
      const yStr = yDate.toISOString().split('T')[0];
      filterStart = yStr;
      filterEnd = yStr;
    } else if (datePreset === 'last7') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      filterStart = past7.toISOString().split('T')[0];
      filterEnd = todayStr;
    } else if (datePreset === 'thisMonth') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      filterStart = `${y}-${m}-01`;
      filterEnd = todayStr;
    } else if (datePreset === 'custom') {
      filterStart = customStartDate ? normalizeToDateString(customStartDate) : null;
      filterEnd = customEndDate ? normalizeToDateString(customEndDate) : null;
    }

    return allPainterJobs.filter(jc => {
      // Date Check
      const jobDate = getJobEffectiveDate(jc);
      if (filterStart && jobDate && jobDate < filterStart) return false;
      if (filterEnd && jobDate && jobDate > filterEnd) return false;

      // Status Check
      const isCompleted = jc.status === 'Completed' || jc.status === 'Closed' || jc.painterJobStatus === 'Verified & Accepted';
      const isPendingVerification = jc.painterJobStatus === 'verification_pending' || jc.painterJobStatus === 'Verification Pending';
      const isRework = jc.jobCardType === 'rework_child' || jc.status === 'Rework' || jc.reworkStatus;
      const isInProgress = !isCompleted && !isPendingVerification;

      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'in_progress' && !isInProgress) return false;
      if (statusFilter === 'verification_pending' && !isPendingVerification) return false;
      if (statusFilter === 'rework' && !isRework) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNo = jc.jobCardNo?.toLowerCase().includes(q);
        const matchCustomer = jc.customer?.toLowerCase().includes(q);
        const matchWo = jc.woNo?.toLowerCase().includes(q);
        const matchPart = jc.partCode?.toLowerCase().includes(q) || jc.partDescription?.toLowerCase().includes(q);
        const matchColor = jc.color?.toLowerCase().includes(q);
        if (!matchNo && !matchCustomer && !matchWo && !matchPart && !matchColor) return false;
      }

      return true;
    });
  }, [allPainterJobs, datePreset, customStartDate, customEndDate, statusFilter, searchQuery]);

  // 3. Daily Finished Breakdown ("Date wise kitna job card finish kiya tha")
  const dailyFinishedBreakdown = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; count: number; totalSprayedQty: number; jobCards: JobCard[] }>();

    filteredJobs.forEach(jc => {
      const isCompleted = jc.status === 'Completed' || jc.status === 'Closed' || jc.painterJobStatus === 'Verified & Accepted';
      if (!isCompleted) return;

      const finishDate = getJobCompletionDate(jc) || 'Unknown Date';
      const existing = map.get(finishDate) || {
        date: finishDate,
        displayDate: finishDate !== 'Unknown Date' ? formatDisplayDate(finishDate) : 'Earlier Records',
        count: 0,
        totalSprayedQty: 0,
        jobCards: []
      };

      existing.count += 1;
      existing.totalSprayedQty += (jc.sprayedQty || jc.targetQty || 0);
      existing.jobCards.push(jc);
      map.set(finishDate, existing);
    });

    // Sort dates descending
    return Array.from(map.values()).sort((a, b) => {
      if (a.date === 'Unknown Date') return 1;
      if (b.date === 'Unknown Date') return -1;
      return b.date.localeCompare(a.date);
    });
  }, [filteredJobs]);

  // Filtered Summary Counts
  const filteredCompletedCount = filteredJobs.filter(j => j.status === 'Completed' || j.painterJobStatus === 'Verified & Accepted').length;
  const filteredTotalSprayed = filteredJobs.reduce((sum, j) => sum + (j.sprayedQty || 0), 0);
  const filteredTotalTarget = filteredJobs.reduce((sum, j) => sum + (j.targetQty || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP NAVIGATION BREADCRUMB STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[24px] border border-[#ececec] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#17191c]" />
            <span>Back to Booths & Fleet</span>
          </button>
          <div className="h-4 w-px bg-[#dcdfe4] hidden sm:block" />
          <div className="text-xs text-[#777b86]">
            <span className="font-semibold text-[#17191c]">Job Cards</span>
            <span className="mx-1.5">/</span>
            <span>Painting Lines & Spray Booth Fleet</span>
            <span className="mx-1.5">/</span>
            <span className="text-[#8a6521] font-semibold">{painter.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(painter)}
            className="px-4 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5 text-[#777b86]" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* PAINTER PROFILE DOSSIER HERO CARD */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Avatar & Name */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#faf3e0] border-2 border-[#c09748] flex items-center justify-center font-mono font-bold text-xl sm:text-2xl text-[#8a6521] shadow-xs shrink-0">
              {painter.code || 'PTR'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif font-normal text-2xl sm:text-3xl text-[#17191c]">
                  {painter.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
                  ● Certified Coating Technician
                </span>
                {allPainterJobs.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-[#8a6521]" />
                    <span>ERP Protected ({allPainterJobs.length} Jobs Linked)</span>
                  </span>
                )}
              </div>

              <div className="text-sm text-[#c09748] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{painter.specialization || 'Industrial 2K Polyurethane Coating'}</span>
              </div>

              <div className="text-xs text-[#777b86] flex flex-wrap items-center gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#979799]" />
                  <span>Station: <strong className="text-[#17191c]">{painter.boothNo || 'Dynamic Allocation'}</strong></span>
                </span>
                {painter.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-[#979799]" />
                      <span>{painter.phone}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Workload Box */}
          <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] lg:min-w-[280px] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#17191c]">Live Floor Capacity:</span>
              <span className={`font-mono font-bold ${isCapped ? 'text-amber-700' : 'text-emerald-700'}`}>
                {activeJobsCount} / 2 Slots Occupied
              </span>
            </div>
            {/* Visual 2-slot bars */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`h-2.5 rounded-full transition ${activeJobsCount >= 1 ? 'bg-[#c09748]' : 'bg-[#e5e7eb]'}`} />
              <div className={`h-2.5 rounded-full transition ${activeJobsCount >= 2 ? 'bg-[#c09748]' : 'bg-[#e5e7eb]'}`} />
            </div>
            <div className="text-[11px] text-right font-medium">
              {isCapped ? (
                <span className="text-amber-700 font-semibold">⚠️ Floor Limit Reached (Max 2 Jobs)</span>
              ) : (
                <span className="text-emerald-700">✓ Ready to receive new Job Card</span>
              )}
            </div>
          </div>
        </div>

        {/* METRICS STRIP (LIFETIME KPIS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#ececec]">
          <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
            <div className="text-[11px] text-[#777b86]">Total Assigned</div>
            <div className="font-serif font-normal text-2xl text-[#17191c] mt-0.5">{allPainterJobs.length}</div>
            <div className="text-[10px] text-[#979799] mt-0.5">Lifetime Job Cards</div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
            <div className="text-[11px] text-[#777b86]">Finished Cards</div>
            <div className="font-serif font-normal text-2xl text-emerald-700 mt-0.5">{perfStats.completedJobs}</div>
            <div className="text-[10px] text-[#979799] mt-0.5">Completed & Closed</div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
            <div className="text-[11px] text-[#777b86]">Active On Floor</div>
            <div className="font-serif font-normal text-2xl text-[#c09748] mt-0.5">{activeJobsCount}</div>
            <div className="text-[10px] text-[#979799] mt-0.5">Currently Spraying</div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
            <div className="text-[11px] text-[#777b86]">Total Pieces Coated</div>
            <div className="font-serif font-normal text-2xl text-[#17191c] mt-0.5">
              {allPainterJobs.reduce((sum, j) => sum + (j.sprayedQty || 0), 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#979799] mt-0.5">Physical Parts Sprayed</div>
          </div>

          <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] col-span-2 sm:col-span-1">
            <div className="text-[11px] text-[#777b86]">FPA Pass Rate</div>
            <div className="font-serif font-normal text-2xl text-emerald-700 mt-0.5">{perfStats.passRate}%</div>
            <div className="text-[10px] text-[#979799] mt-0.5">★ {perfStats.rating} Star Rating</div>
          </div>
        </div>
      </div>

      {/* DATE-WISE FILTER CONTROL PANEL */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#c09748]" />
            <h3 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
              Date-wise Production Filter & Job History
            </h3>
          </div>
          <span className="text-xs text-[#777b86]">
            Showing <strong>{filteredJobs.length}</strong> of <strong>{allPainterJobs.length}</strong> Job Cards
          </span>
        </div>

        {/* Date Filter Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#17191c] mr-1">Period:</span>
          {(['all', 'today', 'yesterday', 'last7', 'thisMonth', 'custom'] as DatePreset[]).map(preset => {
            const labels: Record<DatePreset, string> = {
              all: 'All Time',
              today: 'Today',
              yesterday: 'Yesterday',
              last7: 'Last 7 Days',
              thisMonth: 'This Month',
              custom: 'Custom Range'
            };
            const isSelected = datePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                    : 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] border border-[#ececec]'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers Row (visible when custom range is active) */}
        {datePreset === 'custom' && (
          <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#f4e5be] flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">From Date (DD-MM-YYYY)</label>
              <PaintkingDatePicker
                value={customStartDate}
                onChange={setCustomStartDate}
                placeholder="Start Date (DD-MM-YYYY)"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">To Date (DD-MM-YYYY)</label>
              <PaintkingDatePicker
                value={customEndDate}
                onChange={setCustomEndDate}
                placeholder="End Date (DD-MM-YYYY)"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="self-end px-3 py-2 rounded-full text-xs text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4] cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Status Pills & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#17191c] mr-1">Status:</span>
            {([
              { key: 'all', label: 'All Jobs' },
              { key: 'completed', label: 'Finished Only' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'verification_pending', label: 'Pending Verification' },
              { key: 'rework', label: 'Rework' }
            ] as Array<{ key: StatusFilter; label: string }>).map(item => {
              const isSelected = statusFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#17191c] text-white shadow-2xs'
                      : 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] border border-[#ececec]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-[#979799] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search JC #, Part, WO, Customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[#ececec] bg-[#fafafb] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
            />
          </div>
        </div>

        {/* Active Filter Period Summary Banner */}
        <div className="p-3 rounded-[14px] bg-[#faf7ed] border border-[#f4e5be] text-xs text-[#8a6521] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#c09748]" />
            <span>
              <strong>Filtered Summary:</strong> {filteredJobs.length} Job Cards found • <strong>{filteredCompletedCount} Finished</strong> • <strong>{filteredTotalSprayed.toLocaleString()} / {filteredTotalTarget.toLocaleString()} Pcs Sprayed</strong>
            </span>
          </div>

          {(datePreset !== 'all' || statusFilter !== 'all' || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setDatePreset('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] underline font-bold cursor-pointer hover:text-[#17191c]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* DAILY FINISHED BREAKDOWN SECTION ("Date wise kitna job card finish kiya tha") */}
      {dailyFinishedBreakdown.length > 0 && (
        <div className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c09748]" />
              <h3 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                Daily Finished Production Breakdown ({dailyFinishedBreakdown.length} Production Days Recorded)
              </h3>
            </div>
            <span className="text-xs text-[#777b86]">Date-wise Completed Jobs & Output</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dailyFinishedBreakdown.map(day => (
              <div
                key={day.date}
                className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] hover:border-[#c09748] transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#17191c]">
                    <Calendar className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>{day.displayDate}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    {day.count} Finished {day.count === 1 ? 'Job' : 'Jobs'}
                  </span>
                </div>

                <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] text-[11px] text-[#777b86] flex justify-between">
                  <span>Output Sprayed:</span>
                  <strong className="text-[#17191c]">{day.totalSprayedQty.toLocaleString()} Pcs</strong>
                </div>

                {/* Job Cards list for this date */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-[#979799]">Finished Job Cards:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {day.jobCards.map(jc => (
                      <button
                        key={jc.jobCardNo}
                        type="button"
                        onClick={() => onViewJobCard(jc)}
                        className="px-2 py-0.5 rounded-md bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-mono font-bold text-[10px] hover:bg-[#f4e5be] transition cursor-pointer flex items-center gap-1"
                        title={`View ${jc.jobCardNo}`}
                      >
                        <span>{jc.jobCardNo}</span>
                        <Eye className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE JOB CARDS PRODUCTION LEDGER */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#c09748]" />
            <h3 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
              Job Cards Production Ledger ({filteredJobs.length})
            </h3>
          </div>
          <span className="text-xs text-[#777b86]">Complete history of jobs worked by this technician</span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-[#fafafb] rounded-[18px] border border-dashed border-[#dcdfe4]">
            <FileText className="w-8 h-8 text-[#979799] mx-auto" />
            <h4 className="font-serif text-base text-[#17191c]">No Job Cards Found</h4>
            <p className="text-xs text-[#777b86]">
              {allPainterJobs.length === 0
                ? "This painter does not have any job cards assigned yet. When creating a Job Card in Point 3, assign this technician."
                : "No job cards match your selected date or status filter criteria. Try clicking 'Reset Filters'."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ececec] text-[#777b86] font-semibold text-[11px] uppercase tracking-wider bg-[#fafafb]">
                    <th className="py-3 px-3">Job Card # & Dates</th>
                    <th className="py-3 px-3">Customer & WO</th>
                    <th className="py-3 px-3">Part Details & Color</th>
                    <th className="py-3 px-3">Progress / Output</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {filteredJobs.map(jc => {
                    const isCompleted = jc.status === 'Completed' || jc.status === 'Closed' || jc.painterJobStatus === 'Verified & Accepted';
                    const isPendingVerification = jc.painterJobStatus === 'verification_pending' || jc.painterJobStatus === 'Verification Pending';
                    const percent = jc.targetQty ? Math.min(100, Math.round((jc.sprayedQty / jc.targetQty) * 100)) : 0;
                    const issueDate = formatDisplayDate(jc.issueDate || jc.createdAt);
                    const finishDate = jc.closedAt || jc.verifiedAt || jc.painterFinishedAt ? formatDisplayDate(jc.closedAt || jc.verifiedAt || jc.painterFinishedAt) : null;

                    return (
                      <tr key={jc.jobCardNo} className="hover:bg-[#fafafb] transition">
                        <td className="py-3 px-3 align-top">
                          <div className="font-mono font-bold text-xs text-[#17191c] flex items-center gap-1.5">
                            <span>{jc.jobCardNo}</span>
                            {jc.jobCardType === 'rework_child' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">RW</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#777b86] mt-0.5 space-y-0.5">
                            <div>Issued: {issueDate}</div>
                            {finishDate && (
                              <div className="text-emerald-700 font-semibold">Finished: {finishDate}</div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-[#17191c]">{jc.customer}</div>
                          <div className="text-[10px] text-[#777b86] font-mono mt-0.5">WO: {jc.woNo || '—'}</div>
                        </td>

                        <td className="py-3 px-3 align-top max-w-[220px]">
                          <div className="font-mono font-bold text-[#8a6521] text-[11px]">{jc.partCode}</div>
                          <div className="text-[#17191c] text-[11px] truncate" title={jc.partDescription}>{jc.partDescription}</div>
                          <div className="text-[10px] text-[#777b86] flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#c09748]" />
                            <span className="truncate">{jc.color}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#17191c]">
                            <span>{jc.sprayedQty} / {jc.targetQty} Pcs</span>
                            <span className="text-[#8a6521]">{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                percent >= 100 ? 'bg-emerald-600' : 'bg-[#c09748]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isPendingVerification
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {isCompleted ? 'Completed' : isPendingVerification ? 'Awaiting Verification' : jc.status || 'In Process'}
                          </span>
                          {jc.fpaStatus && (
                            <div className="text-[9px] text-[#777b86] mt-0.5">
                              FPA: <strong className={jc.fpaStatus === 'Approved' ? 'text-emerald-700' : 'text-amber-700'}>{jc.fpaStatus}</strong>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top text-right">
                          <button
                            type="button"
                            onClick={() => onViewJobCard(jc)}
                            className="px-3 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-3 h-3 text-[#777b86]" />
                            <span>View Card</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
              {filteredJobs.map(jc => {
                const isCompleted = jc.status === 'Completed' || jc.status === 'Closed' || jc.painterJobStatus === 'Verified & Accepted';
                const percent = jc.targetQty ? Math.min(100, Math.round((jc.sprayedQty / jc.targetQty) * 100)) : 0;
                const issueDate = formatDisplayDate(jc.issueDate || jc.createdAt);
                const finishDate = jc.closedAt || jc.verifiedAt || jc.painterFinishedAt ? formatDisplayDate(jc.closedAt || jc.verifiedAt || jc.painterFinishedAt) : null;

                return (
                  <div
                    key={jc.jobCardNo}
                    className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#17191c]">{jc.jobCardNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isCompleted ? 'Completed' : jc.status || 'In Process'}
                      </span>
                    </div>

                    <div className="text-xs text-[#17191c] font-semibold">{jc.customer}</div>
                    <div className="text-[11px] text-[#777b86]">{jc.partDescription}</div>

                    <div className="p-2 rounded-[12px] bg-white border border-[#ececec] text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span>Output:</span>
                        <strong className="text-[#17191c]">{jc.sprayedQty} / {jc.targetQty} Pcs ({percent}%)</strong>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#979799]">
                        <span>Issued: {issueDate}</span>
                        {finishDate && <span className="text-emerald-700 font-semibold">Finished: {finishDate}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewJobCard(jc)}
                      className="w-full py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#777b86]" />
                      <span>View Job Card Details</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
