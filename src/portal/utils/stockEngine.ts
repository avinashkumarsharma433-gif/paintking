/**
 * PaintKing Operations OS - Pure Stock & FIFO/FEFO Engine (PK-OS Store Role Upgrade)
 * Pure, deterministic functions for batch selection, validation, reconciliation, and returns.
 */

import {
  StockBatch,
  StockCategory,
  StockMaterialType,
  BatchIssueLine,
  FifoOverrideReasonCode,
  BalanceReturnSlip,
  PlantLocation
} from '../types/portalTypes';

export interface SuggestBatchesParams {
  itemCode?: string;
  itemName?: string;
  category?: StockCategory;
  materialType?: StockMaterialType;
  requestedQty: number;
  plant?: PlantLocation;
  customer?: string;
  partCode?: string;
  colour?: string;
}

export interface BatchAllocationResult {
  allocations: Array<{
    batch: StockBatch;
    allocatedQty: number;
    balanceAfter: number;
  }>;
  suggestedLines: BatchIssueLine[];
  totalAllocated: number;
  shortageQty: number;
  isFullyCovered: boolean;
  strategyUsed: 'FEFO' | 'FIFO';
}

export interface FifoOverrideCheckResult {
  isOverride: boolean;
  skippedBatches: StockBatch[];
  suggestedBatchIds: string[];
  reasonRequired: boolean;
  warningMessage?: string;
}

export interface IssueValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface JobReconciliationResult {
  issuedQty: number;
  goodQty: number;
  rejectQty: number;
  returnedQty: number;
  accountedQty: number;
  variance: number;
  isBalanced: boolean;
  status: 'Reconciled' | 'Shortage / Material Loss' | 'Excess Recorded';
}

export interface BatchShelfLifeInfo {
  daysLeft: number;
  isExpired: boolean;
  isNearExpiry: boolean;
  daysSinceReceived: number;
  effectiveExpiryDate: string;
}

/**
 * Standard today helper for plant dates (defaults to today's date YYYY-MM-DD)
 */
export function getPlantTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Normalizes date string into YYYY-MM-DD
 */
export function normalizeDateString(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  // Handle DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
    const parts = clean.split(/[-/]/);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  // If ISO string like 2026-10-28T...
  return clean.split('T')[0];
}

/**
 * Calculates days between two date strings (YYYY-MM-DD)
 */
export function diffInDays(fromDate: string, toDate: string): number {
  const from = new Date(normalizeDateString(fromDate)).getTime();
  const to = new Date(normalizeDateString(toDate)).getTime();
  if (isNaN(from) || isNaN(to)) return 0;
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a material is a chemical consumable requiring FEFO (First-Expired, First-Out)
 */
export function isChemicalConsumable(
  materialType?: string,
  category?: string,
  itemName?: string
): boolean {
  if (category === 'PARTY_MATERIAL') return false;

  const mat = (materialType || '').toLowerCase();
  const item = (itemName || '').toLowerCase();

  if (mat === 'substrate' || mat === 'raw_part') return false;
  if (['paint', 'thinner', 'hardener', 'primer', 'activator', 'clear_coat', 'uv_ink'].includes(mat)) {
    return true;
  }

  const chemicalKeywords = [
    'paint',
    'thinner',
    'hardener',
    'primer',
    'activator',
    'clear',
    'lacquer',
    'pu',
    'basecoat',
    'topcoat',
    'solvent',
    'catalyst',
    'reducer'
  ];

  if (chemicalKeywords.some(k => mat.includes(k))) return true;
  if (chemicalKeywords.some(k => item.includes(k))) return true;

  return false;
}

/**
 * Computes real shelf-life information for any stock batch.
 */
export function calculateBatchShelfLife(
  batch: StockBatch,
  warnWindowDays: number = 30
): BatchShelfLifeInfo {
  const today = getPlantTodayDate();
  const received = normalizeDateString(batch.receivedDate) || today;
  const daysSinceReceived = Math.max(0, diffInDays(received, today));

  let effectiveExpiry = normalizeDateString(batch.expiryDate);

  // If no explicit expiry date, fallback to 180 days shelf life from receipt date
  if (!effectiveExpiry) {
    const recDate = new Date(received);
    recDate.setDate(recDate.getDate() + 180);
    effectiveExpiry = recDate.toISOString().split('T')[0];
  }

  const daysLeft = diffInDays(today, effectiveExpiry);
  const isExpired = daysLeft <= 0 || batch.status === 'Expired';
  const isNearExpiry = !isExpired && daysLeft <= warnWindowDays;

  return {
    daysLeft,
    isExpired,
    isNearExpiry,
    daysSinceReceived,
    effectiveExpiryDate: effectiveExpiry
  };
}

/**
 * Filters and sorts batches according to FIFO/FEFO rules.
 */
export function getEligibleSortedBatches(
  params: SuggestBatchesParams,
  allBatches: StockBatch[]
): { batches: StockBatch[]; strategy: 'FEFO' | 'FIFO' } {
  const isChemical = isChemicalConsumable(params.materialType, params.category, params.itemName);
  const strategy: 'FEFO' | 'FIFO' = isChemical ? 'FEFO' : 'FIFO';
  const today = getPlantTodayDate();

  const reqItemName = (params.itemName || '').trim().toLowerCase();
  const reqItemCode = (params.itemCode || '').trim().toLowerCase();
  const reqCustomer = (params.customer || '').trim().toLowerCase();
  const reqPartCode = (params.partCode || '').trim().toLowerCase();
  const reqColour = (params.colour || '').trim().toLowerCase();

  const filtered = allBatches.filter(batch => {
    // 1. Plant location match (if specified)
    if (params.plant && batch.plant.toLowerCase() !== params.plant.toLowerCase()) {
      return false;
    }

    // 2. Status: MUST be 'Available' (exclude Quarantine, QC Hold, Expired, Exhausted)
    if (batch.status !== 'Available') {
      return false;
    }

    // 3. Balance quantity must be strictly positive
    if (Number(batch.balanceQty) <= 0) {
      return false;
    }

    // 4. Expired batches cannot be suggested or issued
    const shelfLife = calculateBatchShelfLife(batch);
    if (shelfLife.isExpired) {
      return false;
    }

    // 5. Category and Identity match
    if (params.category === 'PARTY_MATERIAL') {
      if (batch.category !== 'PARTY_MATERIAL') return false;

      // Customer match
      if (reqCustomer && batch.customer) {
        if (!batch.customer.toLowerCase().includes(reqCustomer) && !reqCustomer.includes(batch.customer.toLowerCase())) {
          return false;
        }
      }

      // Part code match
      if (reqPartCode && batch.partCode) {
        if (!batch.partCode.toLowerCase().includes(reqPartCode) && !reqPartCode.includes(batch.partCode.toLowerCase())) {
          return false;
        }
      }

      // Colour match
      if (reqColour && batch.colour) {
        if (!batch.colour.toLowerCase().includes(reqColour) && !reqColour.includes(batch.colour.toLowerCase())) {
          return false;
        }
      }

      return true;
    }

    // For Company Consumables:
    // If materialType is specified on request and batch, they MUST match (Strict type isolation)
    if (params.materialType && batch.materialType) {
      if (params.materialType.toLowerCase() !== batch.materialType.toLowerCase()) {
        return false;
      }
    }

    if (reqItemCode && batch.itemCode && batch.itemCode.toLowerCase() === reqItemCode) {
      return true;
    }

    if (reqItemName && batch.itemName) {
      const bName = batch.itemName.toLowerCase();
      if (bName.includes(reqItemName) || reqItemName.includes(bName)) {
        return true;
      }
    }

    if (params.materialType && batch.materialType && params.materialType.toLowerCase() === batch.materialType.toLowerCase()) {
      return true;
    }

    return false;
  });

  // Sort according to strategy
  const sorted = [...filtered].sort((a, b) => {
    if (strategy === 'FEFO') {
      // Earliest expiryDate first
      const expA = normalizeDateString(a.expiryDate) || '9999-12-31';
      const expB = normalizeDateString(b.expiryDate) || '9999-12-31';
      if (expA !== expB) {
        return expA.localeCompare(expB);
      }
      // Tie breaker: earliest receivedDate
      const recA = normalizeDateString(a.receivedDate) || '9999-12-31';
      const recB = normalizeDateString(b.receivedDate) || '9999-12-31';
      if (recA !== recB) {
        return recA.localeCompare(recB);
      }
      return a.batchId.localeCompare(b.batchId);
    } else {
      // FIFO: Earliest receivedDate first
      const recA = normalizeDateString(a.receivedDate) || '9999-12-31';
      const recB = normalizeDateString(b.receivedDate) || '9999-12-31';
      if (recA !== recB) {
        return recA.localeCompare(recB);
      }
      return a.batchId.localeCompare(b.batchId);
    }
  });

  return { batches: sorted, strategy };
}

/**
 * Suggests batches automatically using FEFO for chemical consumables and FIFO for substrates/party items.
 * If one batch cannot cover the requested qty, auto-splits across multiple batches.
 */
export function suggestBatches(
  params: SuggestBatchesParams,
  availableBatches: StockBatch[]
): BatchAllocationResult {
  const { batches: sortedBatches, strategy } = getEligibleSortedBatches(params, availableBatches);

  let remainingQty = Number(params.requestedQty) || 0;
  const allocations: BatchAllocationResult['allocations'] = [];
  const suggestedLines: BatchIssueLine[] = [];

  for (const batch of sortedBatches) {
    if (remainingQty <= 0) break;

    const allocQty = Math.min(remainingQty, batch.balanceQty);
    const balanceAfter = Math.max(0, batch.balanceQty - allocQty);

    allocations.push({
      batch,
      allocatedQty: allocQty,
      balanceAfter
    });

    suggestedLines.push({
      batchId: batch.batchId,
      grnNo: batch.grnNo,
      supplierBatchNo: batch.supplierBatchNo,
      issuedQty: allocQty,
      expiryDate: batch.expiryDate,
      receivedDate: batch.receivedDate,
      uom: batch.uom
    });

    remainingQty -= allocQty;
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedQty, 0);
  const shortageQty = Math.max(0, params.requestedQty - totalAllocated);

  return {
    allocations,
    suggestedLines,
    totalAllocated,
    shortageQty,
    isFullyCovered: shortageQty === 0 && totalAllocated > 0,
    strategyUsed: strategy
  };
}

/**
 * Override detection: checks if the chosen batches skip an older or earlier-expiry available batch.
 */
export function detectFifoOverrides(
  chosenLines: BatchIssueLine[],
  params: SuggestBatchesParams,
  allBatches: StockBatch[]
): FifoOverrideCheckResult {
  if (!chosenLines || chosenLines.length === 0) {
    return {
      isOverride: false,
      skippedBatches: [],
      suggestedBatchIds: [],
      reasonRequired: false
    };
  }

  const { batches: idealSortedBatches, strategy } = getEligibleSortedBatches(params, allBatches);

  if (idealSortedBatches.length === 0) {
    return {
      isOverride: false,
      skippedBatches: [],
      suggestedBatchIds: [],
      reasonRequired: false
    };
  }

  const chosenBatchIds = new Set(chosenLines.map(l => l.batchId));
  const suggestedBatchIds = idealSortedBatches.map(b => b.batchId);

  // Find the highest priority ideal batch that was completely skipped or not fully consumed
  // while a later batch was chosen
  const skippedBatches: StockBatch[] = [];

  // Find the index of the latest batch chosen in the ideal sorted order
  let maxChosenIndex = -1;
  for (let i = 0; i < idealSortedBatches.length; i++) {
    if (chosenBatchIds.has(idealSortedBatches[i].batchId)) {
      maxChosenIndex = Math.max(maxChosenIndex, i);
    }
  }

  // If any batch before maxChosenIndex was not chosen, or chosen with less than its available balance,
  // it is an override
  for (let i = 0; i < maxChosenIndex; i++) {
    const candidate = idealSortedBatches[i];
    const chosenLine = chosenLines.find(l => l.batchId === candidate.batchId);

    if (!chosenLine) {
      // Skipped completely
      skippedBatches.push(candidate);
    } else if (chosenLine.issuedQty < candidate.balanceQty) {
      // Candidate had remaining balance that wasn't utilized before jumping to a later batch
      skippedBatches.push(candidate);
    }
  }

  const isOverride = skippedBatches.length > 0;

  let warningMessage: string | undefined;
  if (isOverride) {
    const firstSkipped = skippedBatches[0];
    const ruleLabel = strategy === 'FEFO' ? 'Earlier Expiry (FEFO)' : 'Older Received (FIFO)';
    warningMessage = `Deviation detected: Batch ${firstSkipped.supplierBatchNo || firstSkipped.batchId} (${ruleLabel}: ${strategy === 'FEFO' ? firstSkipped.expiryDate : firstSkipped.receivedDate}) is available in stock but was bypassed. Reason code & supervisor remark required.`;
  }

  return {
    isOverride,
    skippedBatches,
    suggestedBatchIds,
    reasonRequired: isOverride,
    warningMessage
  };
}

/**
 * Validates a batch issue.
 * Strict rule: Expired batches are BLOCKED with NO override possible.
 */
export function validateIssue(
  lines: Array<{ batchId: string; issuedQty: number }>,
  allBatches: StockBatch[]
): IssueValidationResult {
  const errors: string[] = [];

  if (!lines || lines.length === 0) {
    return { isValid: false, errors: ['At least one batch must be selected for issue.'] };
  }

  const batchMap = new Map(allBatches.map(b => [b.batchId, b]));

  for (const line of lines) {
    const batch = batchMap.get(line.batchId);
    if (!batch) {
      errors.push(`Stock batch "${line.batchId}" not found in system.`);
      continue;
    }

    // BLOCK EXPIRED BATCHES - NO OVERRIDE POSSIBLE
    const shelfLife = calculateBatchShelfLife(batch);
    if (shelfLife.isExpired || batch.status === 'Expired') {
      errors.push(
        `CRITICAL QUALITY BLOCK: Batch "${batch.supplierBatchNo || batch.batchId}" is EXPIRED (Expiry: ${batch.expiryDate || 'N/A'}). Issuing expired chemicals is strictly prohibited by PaintKing QA protocol. No override possible.`
      );
    }

    // BLOCK QUARANTINE / QC HOLD
    if (batch.status === 'Quarantine' || batch.status === 'QC Hold') {
      errors.push(
        `HOLD BLOCK: Batch "${batch.supplierBatchNo || batch.batchId}" is on "${batch.status}". Must be cleared by QA before issue.`
      );
    }

    if (line.issuedQty <= 0) {
      errors.push(`Issued quantity for batch "${batch.supplierBatchNo || batch.batchId}" must be greater than zero.`);
    }

    if (line.issuedQty > batch.balanceQty) {
      errors.push(
        `INSUFFICIENT STOCK: Cannot issue ${line.issuedQty} ${batch.uom} from batch "${batch.supplierBatchNo || batch.batchId}". Available balance is only ${batch.balanceQty} ${batch.uom}.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Deducts issued quantities from current batches atomically.
 * Sets status to 'Exhausted' if balance reaches 0.
 */
export function applyIssueToBatches(
  issueLines: BatchIssueLine[],
  currentBatches: StockBatch[]
): StockBatch[] {
  const deductions = new Map<string, number>();
  for (const line of issueLines) {
    const prev = deductions.get(line.batchId) || 0;
    deductions.set(line.batchId, prev + Number(line.issuedQty));
  }

  return currentBatches.map(batch => {
    const qtyToDeduct = deductions.get(batch.batchId);
    if (!qtyToDeduct) return batch;

    const newBalance = Math.max(0, batch.balanceQty - qtyToDeduct);
    const newStatus = newBalance === 0 ? 'Exhausted' : batch.status;

    return {
      ...batch,
      balanceQty: newBalance,
      status: newStatus
    };
  });
}

/**
 * Reconciles production usage with issued stock.
 * Formula: Issued = Good + Reject + Returned + Variance
 */
export function reconcileJob(
  issuedQty: number,
  goodQty: number,
  rejectQty: number,
  returnedQty: number
): JobReconciliationResult {
  const accountedQty = Number(goodQty || 0) + Number(rejectQty || 0) + Number(returnedQty || 0);
  const variance = Number(issuedQty || 0) - accountedQty;
  const isBalanced = variance === 0;

  let status: JobReconciliationResult['status'] = 'Reconciled';
  if (variance > 0) status = 'Shortage / Material Loss';
  else if (variance < 0) status = 'Excess Recorded';

  return {
    issuedQty: Number(issuedQty || 0),
    goodQty: Number(goodQty || 0),
    rejectQty: Number(rejectQty || 0),
    returnedQty: Number(returnedQty || 0),
    accountedQty,
    variance,
    isBalanced,
    status
  };
}

/**
 * Credits verified returned quantities back to the SAME batch.
 * Rules:
 * - 'Unopened / Intact' -> Full credit to same batchId.
 * - 'Opened - Usable' -> Full credit to same batchId.
 * - 'Mixed or Pot-life Expired - Scrap' -> Scrapped! Never restocked.
 */
export function applyReturn(
  returnSlip: BalanceReturnSlip,
  currentBatches: StockBatch[]
): StockBatch[] {
  const creditsByBatchId = new Map<string, number>();
  const creditsBySupplierBatch = new Map<string, number>();
  const creditsByGrn = new Map<string, number>();

  for (const line of returnSlip.lines) {
    // Only restock usable materials
    if (line.condition === 'Unopened / Intact' || line.condition === 'Opened - Usable') {
      const restockQty = Number(line.storeCountedQty || 0);
      if (restockQty > 0) {
        if (line.batchId) {
          creditsByBatchId.set(line.batchId, (creditsByBatchId.get(line.batchId) || 0) + restockQty);
        }
        if (line.supplierBatchNo) {
          creditsBySupplierBatch.set(line.supplierBatchNo, (creditsBySupplierBatch.get(line.supplierBatchNo) || 0) + restockQty);
        }
        if (line.grnNo) {
          creditsByGrn.set(line.grnNo, (creditsByGrn.get(line.grnNo) || 0) + restockQty);
        }
      }
    }
  }

  let matchedBatchIds = new Set<string>();

  return currentBatches.map(batch => {
    let creditQty = 0;
    if (creditsByBatchId.has(batch.batchId)) {
      creditQty = creditsByBatchId.get(batch.batchId)!;
      matchedBatchIds.add(batch.batchId);
    } else if (batch.supplierBatchNo && creditsBySupplierBatch.has(batch.supplierBatchNo)) {
      creditQty = creditsBySupplierBatch.get(batch.supplierBatchNo)!;
      matchedBatchIds.add(batch.batchId);
    } else if (batch.grnNo && creditsByGrn.has(batch.grnNo) && !matchedBatchIds.has(batch.batchId)) {
      creditQty = creditsByGrn.get(batch.grnNo)!;
      matchedBatchIds.add(batch.batchId);
    }

    if (!creditQty) return batch;

    const newBalance = batch.balanceQty + creditQty;
    // Restore exhausted status back to Available
    const newStatus = batch.status === 'Exhausted' ? 'Available' : batch.status;

    return {
      ...batch,
      balanceQty: newBalance,
      status: newStatus
    };
  });
}
