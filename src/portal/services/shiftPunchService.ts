/**
 * PK-OS Industrial Shift & Punch Resolution Engine
 * Handles night shifts crossing midnight, minimum gap between IN/OUT,
 * prevention of double INs, max shift length limits, and fixed terminal modes.
 */

import { AttendanceRecord, Employee, LocationStamp, PunchEvidenceMetadata, TerminalConfig } from '../types/hrAttendanceTypes';

export interface ShiftResolutionResult {
  allowed: boolean;
  action: 'IN' | 'OUT' | 'REJECT';
  targetRecordId?: string;
  reason?: string;
  shiftDate: string; // The canonical operational date for this shift
  isLate?: boolean;
}

/**
 * Determine if shift is Night Shift (crosses midnight, e.g. 22:00 - 06:30)
 */
export function isNightShift(shiftName: string): boolean {
  return shiftName.toLowerCase().includes('night') || shiftName.includes('22:00');
}

/**
 * Given current timestamp and employee shift, resolve the canonical operational shift date.
 * For night shifts between 00:00 and 08:00 in the morning, the shift belongs to yesterday's date.
 */
export function getOperationalShiftDate(now: Date, shiftName: string): string {
  const hours = now.getHours();
  const dateCopy = new Date(now);

  if (isNightShift(shiftName) && hours < 8) {
    // Midnight to 8 AM belongs to yesterday's night shift
    dateCopy.setDate(dateCopy.getDate() - 1);
  }

  return dateCopy.toISOString().split('T')[0];
}

/**
 * Resolve whether a punch is an IN or OUT or REJECT.
 */
export function resolveShiftPunch(
  employee: Employee,
  existingRecords: AttendanceRecord[],
  config: Partial<TerminalConfig> = {},
  now: Date = new Date()
): ShiftResolutionResult {
  const nowMs = now.getTime();
  const shiftName = employee.shift || 'General (09:00 - 18:00)';
  const operationalDate = getOperationalShiftDate(now, shiftName);
  const minGapMinutes = config.minPunchGapMinutes ?? 15;
  const maxShiftHours = config.maxShiftDurationHours ?? 16;
  const terminalMode = config.terminalMode || 'AUTO';

  // Find active or open attendance record for this operational shift date or recent open shift
  const safeRecords = Array.isArray(existingRecords)
    ? existingRecords.filter((r) => r && r.employeeId === employee.id)
    : [];

  // 1. Look for today's operational record
  let currentRecord = safeRecords.find((r) => r.date === operationalDate);

  // 2. If no record for operationalDate, look for any open record within maxShiftHours (e.g. night shift started yesterday)
  if (!currentRecord) {
    currentRecord = safeRecords.find((r) => {
      if (!r.inTime || r.outTime) return false;
      const [inH, inM, inS] = r.inTime.split(':').map(Number);
      const inDate = new Date(r.date);
      inDate.setHours(inH || 0, inM || 0, inS || 0, 0);
      const elapsedHours = (nowMs - inDate.getTime()) / (1000 * 60 * 60);
      return elapsedHours <= maxShiftHours;
    });
  }

  // FIXED TERMINAL MODE: FIXED_IN
  if (terminalMode === 'FIXED_IN') {
    if (currentRecord && currentRecord.inTime) {
      return {
        allowed: false,
        action: 'REJECT',
        reason: `Double IN prevented: Punch IN already registered at ${currentRecord.inTime}`,
        shiftDate: operationalDate,
      };
    }
    return {
      allowed: true,
      action: 'IN',
      shiftDate: operationalDate,
      isLate: checkIfLate(now, shiftName),
    };
  }

  // FIXED TERMINAL MODE: FIXED_OUT
  if (terminalMode === 'FIXED_OUT') {
    if (!currentRecord || !currentRecord.inTime) {
      return {
        allowed: false,
        action: 'REJECT',
        reason: `Missing IN punch: Cannot punch OUT without prior IN registration`,
        shiftDate: operationalDate,
      };
    }
    if (currentRecord.outTime) {
      return {
        allowed: false,
        action: 'REJECT',
        reason: `Already punched OUT at ${currentRecord.outTime}`,
        shiftDate: currentRecord.date,
      };
    }
    return {
      allowed: true,
      action: 'OUT',
      targetRecordId: currentRecord.id,
      shiftDate: currentRecord.date,
    };
  }

  // AUTO RESOLUTION (Default)
  if (!currentRecord || !currentRecord.inTime) {
    // Brand new IN punch
    return {
      allowed: true,
      action: 'IN',
      shiftDate: operationalDate,
      isLate: checkIfLate(now, shiftName),
    };
  }

  // Record has IN, now checking OUT criteria
  if (currentRecord.inTime && !currentRecord.outTime) {
    // Check minimum gap between IN and OUT
    const [inH, inM, inS] = currentRecord.inTime.split(':').map(Number);
    const inDate = new Date(currentRecord.date);
    inDate.setHours(inH || 0, inM || 0, inS || 0, 0);
    const elapsedMinutes = (nowMs - inDate.getTime()) / (1000 * 60);

    if (elapsedMinutes < minGapMinutes) {
      const waitRemaining = Math.ceil(minGapMinutes - elapsedMinutes);
      return {
        allowed: false,
        action: 'REJECT',
        reason: `Minimum shift punch gap enforced (${minGapMinutes}m). Please wait ${waitRemaining} more minute(s).`,
        shiftDate: currentRecord.date,
      };
    }

    if (elapsedMinutes > maxShiftHours * 60) {
      // Over max shift length - start a fresh IN rather than linking to stale punch
      return {
        allowed: true,
        action: 'IN',
        shiftDate: operationalDate,
        reason: 'Previous shift exceeded maximum duration (16h); starting fresh shift.',
      };
    }

    return {
      allowed: true,
      action: 'OUT',
      targetRecordId: currentRecord.id,
      shiftDate: currentRecord.date,
    };
  }

  // Record already has both IN and OUT
  return {
    allowed: false,
    action: 'REJECT',
    reason: `Shift already completed: IN ${currentRecord.inTime} / OUT ${currentRecord.outTime}`,
    shiftDate: currentRecord.date,
  };
}

function checkIfLate(now: Date, shiftName: string): boolean {
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
  if (shiftName.includes('Morning')) {
    return timeStr > '06:15:00';
  } else if (shiftName.includes('Evening')) {
    return timeStr > '14:15:00';
  } else if (shiftName.includes('Night')) {
    return timeStr > '22:15:00';
  } else {
    // General
    return timeStr > '09:15:00';
  }
}
