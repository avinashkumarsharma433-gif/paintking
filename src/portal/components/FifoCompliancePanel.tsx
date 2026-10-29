import React, { useState, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { FifoOverrideLog, PlantLocation } from '../types/portalTypes';
import { calculateBatchShelfLife, diffInDays, getPlantTodayDate } from '../utils/stockEngine';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  FileText, 
  Filter, 
  Search, 
  Building2, 
  Layers, 
  ShieldAlert,
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';

export const FifoCompliancePanel: React.FC = () => {
  const { 
    fifoOverrideLogs, 
    materialRequisitions, 
    stockBatches, 
    activePlant, 
    currentUser 
  } = usePortalStore();

  const [selectedPlant, setSelectedPlant] = useState<string>(activePlant || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isManagementOrStores = useMemo(() => {
    const role = currentUser?.role;
    return role === 'DIRECTOR' || role === 'PLANT_HEAD' || role === 'STORES';
  }, [currentUser]);

  // Filter logs by plant and search
  const filteredLogs = useMemo(() => {
    return fifoOverrideLogs.filter(log => {
      if (selectedPlant !== 'ALL' && log.plant && log.plant.toLowerCase() !== selectedPlant.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          log.itemName.toLowerCase().includes(q) ||
          log.minNo.toLowerCase().includes(q) ||
          log.mrnNo.toLowerCase().includes(q) ||
          log.reasonCode.toLowerCase().includes(q) ||
          log.issuedBy.toLowerCase().includes(q) ||
          log.remark.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fifoOverrideLogs, selectedPlant, searchQuery]);

  // Calculate 7-day and 30-day compliance metrics
  const complianceStats = useMemo(() => {
    const today = getPlantTodayDate();

    // Find issued requisitions
    const issuedReqs = materialRequisitions.filter(r => {
      if (r.status !== 'Dispatched by Store' && r.status !== 'Received by Production' && r.status !== 'Partially Issued') {
        return false;
      }
      if (selectedPlant !== 'ALL' && r.plant && r.plant.toLowerCase() !== selectedPlant.toLowerCase()) {
        return false;
      }
      return true;
    });

    const issuesLast7Days = issuedReqs.filter(r => {
      const days = diffInDays(r.date, today);
      return days >= 0 && days <= 7;
    });

    const issuesLast30Days = issuedReqs.filter(r => {
      const days = diffInDays(r.date, today);
      return days >= 0 && days <= 30;
    });

    const fifoOk7Days = issuesLast7Days.filter(r => r.fifoStatus !== 'FIFO Override').length;
    const rate7Days = issuesLast7Days.length > 0 
      ? Math.round((fifoOk7Days / issuesLast7Days.length) * 100) 
      : 100;

    const fifoOk30Days = issuesLast30Days.filter(r => r.fifoStatus !== 'FIFO Override').length;
    const rate30Days = issuesLast30Days.length > 0 
      ? Math.round((fifoOk30Days / issuesLast30Days.length) * 100) 
      : 100;

    return {
      totalIssues: issuedReqs.length,
      issuesLast7Days: issuesLast7Days.length,
      rate7Days,
      issuesLast30Days: issuesLast30Days.length,
      rate30Days,
      totalOverrides: filteredLogs.length
    };
  }, [materialRequisitions, filteredLogs, selectedPlant]);

  // Detect Bypassed Batches (Sitting older batches while newer batches exist)
  const bypassedBatchAlerts = useMemo(() => {
    const alerts: Array<{
      itemCode: string;
      itemName: string;
      bypassedBatchNo: string;
      bypassedDate: string;
      bypassedDays: number;
      balanceQty: number;
      uom: string;
      bay?: string;
    }> = [];

    const plantBatches = stockBatches.filter(b => 
      selectedPlant === 'ALL' || b.plant.toLowerCase() === selectedPlant.toLowerCase()
    );

    // Group by item
    const map = new Map<string, typeof plantBatches>();
    plantBatches.forEach(b => {
      const key = b.itemCode || b.itemName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });

    const today = getPlantTodayDate();

    map.forEach((batches, itemKey) => {
      if (batches.length < 2) return;

      // Sort by received date ascending (oldest first)
      const sorted = [...batches].sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));

      const oldest = sorted[0];
      const newerBatches = sorted.slice(1);

      // If the oldest batch has balance, but a newer batch was either partially consumed or has less balance
      if (oldest.balanceQty > 0 && oldest.status === 'Available') {
        const newerConsumed = newerBatches.some(nb => nb.balanceQty < nb.receivedQty);
        if (newerConsumed) {
          const daysInStore = diffInDays(oldest.receivedDate, today);
          alerts.push({
            itemCode: itemKey,
            itemName: oldest.itemName,
            bypassedBatchNo: oldest.supplierBatchNo || oldest.batchId,
            bypassedDate: oldest.receivedDate,
            bypassedDays: daysInStore,
            balanceQty: oldest.balanceQty,
            uom: oldest.uom,
            bay: oldest.storageLocation
          });
        }
      }
    });

    return alerts;
  }, [stockBatches, selectedPlant]);

  if (!isManagementOrStores) {
    return (
      <div className="p-8 text-center bg-white rounded-[24px] border border-[#ececec] space-y-2">
        <ShieldAlert className="w-8 h-8 text-[#979799] mx-auto" />
        <h4 className="text-base font-serif font-normal text-[#17191c]">Restricted Access</h4>
        <p className="text-xs text-[#777b86]">
          The FIFO Compliance &amp; Override Audit Panel is reserved for Plant Head, Director and Store Incharge personas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP COMPLIANCE STATS CARDS                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[20px] bg-white border border-[#ececec] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#777b86]">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">7-Day FIFO Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-800">
            {complianceStats.rate7Days}%
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            Based on {complianceStats.issuesLast7Days} floor issues
          </div>
        </div>

        <div className="p-3.5 rounded-[20px] bg-white border border-[#ececec] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#777b86]">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">30-Day FIFO Rate</span>
            <TrendingUp className="w-4 h-4 text-[#c09748]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#17191c]">
            {complianceStats.rate30Days}%
          </div>
          <div className="text-[10px] text-[#777b86]">
            Rolling monthly audit standard
          </div>
        </div>

        <div className="p-3.5 rounded-[20px] bg-amber-50/50 border border-amber-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Total Overrides</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-amber-900">
            {complianceStats.totalOverrides}
          </div>
          <div className="text-[10px] text-amber-700 font-medium">
            Authorized storekeeper deviations
          </div>
        </div>

        <div className="p-3.5 rounded-[20px] bg-rose-50/50 border border-rose-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Bypassed Batches</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-rose-800">
            {bypassedBatchAlerts.length}
          </div>
          <div className="text-[10px] text-rose-700 font-medium">
            Unissued older stock waiting
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BYPASSED BATCH LIVE ALERTS                                             */}
      {/* ========================================================================= */}
      {bypassedBatchAlerts.length > 0 && (
        <div className="p-4 rounded-[20px] bg-amber-50/60 border border-amber-200 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bypassed Inventory Alerts ({bypassedBatchAlerts.length})</span>
            </div>
            <span className="text-[10px] font-mono text-amber-800">
              Older batches sitting while newer lots were consumed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {bypassedBatchAlerts.map((alert, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-[16px] bg-white border border-amber-200/80 text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between font-mono font-bold text-[#17191c]">
                  <span>Batch: {alert.bypassedBatchNo}</span>
                  <span className="text-amber-800 text-[10.5px]">
                    {alert.balanceQty} {alert.uom} left
                  </span>
                </div>
                <div className="text-[#777b86] text-[11px] truncate" title={alert.itemName}>
                  {alert.itemName}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#777b86] pt-1 border-t border-[#f2f2f3]">
                  <span>Rec: {alert.bypassedDate} ({alert.bypassedDays}d ago)</span>
                  <span className="text-[#8a6521] font-semibold">{alert.bay || 'Stores Bay'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FIFO OVERRIDE AUDIT LOG TABLE & SEARCH CONTROLS                        */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
          <div>
            <h4 className="font-serif font-normal text-base text-[#17191c]">
              FIFO / FEFO Deviation Audit Log
            </h4>
            <p className="text-xs text-[#777b86] mt-0.5">
              Immutable register of all store issues that bypassed ideal FIFO/FEFO suggestions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#777b86] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search overrides..."
                className="h-8 pl-8 pr-3 rounded-full border border-[#dcdfe4] text-xs text-[#17191c] placeholder:text-[#979799] focus:outline-none focus:border-[#c09748]"
              />
            </div>

            {/* Plant Filter */}
            <select
              value={selectedPlant}
              onChange={e => setSelectedPlant(e.target.value)}
              className="h-8 px-2.5 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748] cursor-pointer"
            >
              <option value="ALL">All Plants</option>
              <option value="Haridwar">Haridwar</option>
              <option value="Vasai">Vasai</option>
              <option value="Vapi">Vapi</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>
        </div>

        {/* Override Logs Desktop Table */}
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-[#777b86] text-xs space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="font-semibold text-[#17191c]">100% FIFO / FEFO Compliance</div>
            <div>No override deviations logged matching your filters.</div>
          </div>
        ) : (
          <div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ececec] text-[#777b86] font-mono text-[10px] uppercase">
                    <th className="py-2 px-3">Date &amp; MIN Ref</th>
                    <th className="py-2 px-3">Material &amp; MRN</th>
                    <th className="py-2 px-3">Deviation Details</th>
                    <th className="py-2 px-3">Reason Code</th>
                    <th className="py-2 px-3">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#fafafb] transition">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-xs text-[#c09748]">
                          {log.minNo}
                        </div>
                        <div className="text-[10px] text-[#777b86] font-mono mt-0.5">
                          {log.timestamp}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#17191c] text-xs">
                          {log.itemName}
                        </div>
                        <div className="text-[10px] text-[#777b86] font-mono mt-0.5">
                          Req: {log.mrnNo} ({log.plant})
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="text-[#777b86] line-through">
                            {log.suggestedBatchId}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#c09748]" />
                          <span className="font-bold text-[#17191c] bg-[#faf3e0] px-1.5 py-0.2 rounded-full border border-[#f4e5be]">
                            {log.issuedBatchId}
                          </span>
                        </div>
                        {log.remark && (
                          <div className="text-[10.5px] text-[#777b86] italic mt-0.5" title={log.remark}>
                            "{log.remark}"
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          {log.reasonCode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-xs text-[#17191c] flex items-center gap-1">
                          <User className="w-3 h-3 text-[#777b86]" />
                          <span>{log.issuedBy}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (<640px) */}
            <div className="sm:hidden space-y-2 pt-1">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#c09748]">{log.minNo}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-semibold">
                      {log.reasonCode}
                    </span>
                  </div>

                  <div className="font-semibold text-[#17191c]">{log.itemName}</div>

                  <div className="text-[11px] font-mono flex items-center gap-1 text-[#777b86]">
                    <span className="line-through">{log.suggestedBatchId}</span>
                    <ArrowRight className="w-3 h-3 text-[#c09748]" />
                    <span className="font-bold text-[#17191c]">{log.issuedBatchId}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#777b86] pt-1 border-t border-[#ececec]">
                    <span>By: {log.issuedBy}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
