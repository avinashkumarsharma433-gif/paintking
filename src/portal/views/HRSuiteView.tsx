import React, { useState, useEffect } from 'react';
import { 
  ScanFace, 
  Users, 
  CalendarCheck, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  Clock,
  Activity,
  DollarSign
} from 'lucide-react';
import { usePortalStore } from '../context/PortalStoreContext';
import { HREmployeeDirectory } from '../modules/hr/HREmployeeDirectory';
import { HREnrollFaceModal } from '../modules/hr/HREnrollFaceModal';
import { HRAttendanceTerminal } from '../modules/hr/HRAttendanceTerminal';
import { HRAttendanceRegister } from '../modules/hr/HRAttendanceRegister';
import { RecognitionLab } from '../modules/hr/RecognitionLab';
import { HRPayrollView } from '../modules/hr/HRPayrollView';
import { HRShiftSettings } from '../modules/hr/HRShiftSettings';
import { HRLeaveView } from './HRLeaveView';
import { 
  Employee, 
  AttendanceRecord, 
  LocationStamp,
  PunchEvidenceMetadata,
  PlantShiftDefinition,
  PlantHoliday
} from '../types/hrAttendanceTypes';
import { biometricVault, recordBiometricAudit } from '../services/secureBiometricStorage';

// Zero Hardcoded Mock Employees - All managed via LocalStorage / User Input
const INITIAL_EMPLOYEES: Employee[] = [];

const DEFAULT_SHIFTS: PlantShiftDefinition[] = [
  {
    id: 'SHIFT_GEN',
    name: 'General Day Shift (Plant Operations)',
    code: 'GEN-01',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    halfDayThresholdHours: 4.0,
    isNightShift: false,
    isActive: true,
  },
  {
    id: 'SHIFT_A',
    name: 'Morning Shift A (Liquid & Hydro Coating)',
    code: 'SFT-A',
    startTime: '06:00',
    endTime: '14:30',
    graceMinutes: 15,
    halfDayThresholdHours: 4.0,
    isNightShift: false,
    isActive: true,
  },
  {
    id: 'SHIFT_B',
    name: 'Evening Shift B (UV Plotting & Baking)',
    code: 'SFT-B',
    startTime: '14:00',
    endTime: '22:30',
    graceMinutes: 15,
    halfDayThresholdHours: 4.0,
    isNightShift: false,
    isActive: true,
  },
  {
    id: 'SHIFT_C',
    name: 'Night Shift C (Moulding & Cleanroom)',
    code: 'SFT-C',
    startTime: '22:00',
    endTime: '06:30',
    graceMinutes: 15,
    halfDayThresholdHours: 4.0,
    isNightShift: true,
    isActive: true,
  },
];

const DEFAULT_HOLIDAYS: PlantHoliday[] = [
  { id: 'HOL-1', name: 'Republic Day', date: '2026-01-26', isOptional: false },
  { id: 'HOL-2', name: 'Holi / Rangwali', date: '2026-03-04', isOptional: false },
  { id: 'HOL-3', name: 'Independence Day', date: '2026-08-15', isOptional: false },
  { id: 'HOL-4', name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', isOptional: false },
  { id: 'HOL-5', name: 'Diwali / Deepawali (Plant Holiday)', date: '2026-11-08', isOptional: false },
  { id: 'HOL-6', name: 'Govardhan Puja & Tooling Recalibration', date: '2026-11-09', isOptional: false },
];

export const HRSuiteView: React.FC = () => {
  const { activeSubTab, setActiveSubTab } = usePortalStore();
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'REGISTER' | 'DIRECTORY' | 'LEAVE' | 'LAB' | 'PAYROLL' | 'SHIFTS'>(() => {
    if (activeSubTab === 'TERMINAL') return 'TERMINAL';
    if (activeSubTab === 'REGISTER') return 'REGISTER';
    if (activeSubTab === 'DIRECTORY') return 'DIRECTORY';
    if (activeSubTab === 'LEAVE' || activeSubTab === 'LEAVE_APP') return 'LEAVE';
    if (activeSubTab === 'LAB') return 'LAB';
    if (activeSubTab === 'PAYROLL') return 'PAYROLL';
    if (activeSubTab === 'SHIFTS') return 'SHIFTS';
    return 'TERMINAL';
  });

  // Shifts and Holiday storage state
  const [plantShifts, setPlantShifts] = useState<PlantShiftDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('pk_plant_shifts');
      return saved ? JSON.parse(saved) : DEFAULT_SHIFTS;
    } catch {
      return DEFAULT_SHIFTS;
    }
  });

  const [plantHolidays, setPlantHolidays] = useState<PlantHoliday[]>(() => {
    try {
      const saved = localStorage.getItem('pk_plant_holidays');
      return saved ? JSON.parse(saved) : DEFAULT_HOLIDAYS;
    } catch {
      return DEFAULT_HOLIDAYS;
    }
  });

  // Sync subTab from Sidebar navigation
  useEffect(() => {
    if (activeSubTab === 'TERMINAL') {
      setActiveTab('TERMINAL');
    } else if (activeSubTab === 'REGISTER' || activeSubTab === 'ROSTER') {
      setActiveTab('REGISTER');
    } else if (activeSubTab === 'DIRECTORY') {
      setActiveTab('DIRECTORY');
    } else if (activeSubTab === 'LEAVE' || activeSubTab === 'LEAVE_APP') {
      setActiveTab('LEAVE');
    } else if (activeSubTab === 'LAB') {
      setActiveTab('LAB');
    } else if (activeSubTab === 'PAYROLL') {
      setActiveTab('PAYROLL');
    } else if (activeSubTab === 'SHIFTS') {
      setActiveTab('SHIFTS');
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'TERMINAL' | 'REGISTER' | 'DIRECTORY' | 'LEAVE' | 'LAB' | 'PAYROLL' | 'SHIFTS') => {
    setActiveTab(tab);
    setActiveSubTab(tab);
  };

  // Load from localStorage or initialize with clean empty state (Zero hardcoded profiles)
  // Automatically deduplicates any duplicate employee IDs found in localStorage
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('pk_hr_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((e): e is Employee => Boolean(e && e.id && e.name));
          // Sanitize: ensure every employee has a strictly unique ID
          const seenIds = new Set<string>();
          let maxIdNum = 100;
          for (const e of valid) {
            const m = (e.id || '').match(/PK-EMP-(\d+)/i);
            if (m) {
              const n = parseInt(m[1], 10);
              if (!isNaN(n) && n > maxIdNum) maxIdNum = n;
            }
          }

          const uniqueEmployees: Employee[] = [];
          for (const emp of valid) {
            if (seenIds.has(emp.id)) {
              // Collision detected! Assign fresh unique ID so it doesn't overwrite
              maxIdNum++;
              const freshId = `PK-EMP-${String(maxIdNum).padStart(4, '0')}`;
              uniqueEmployees.push({ ...emp, id: freshId });
              seenIds.add(freshId);
            } else {
              seenIds.add(emp.id);
              uniqueEmployees.push(emp);
            }
          }
          return uniqueEmployees;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pk_hr_attendance_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strict Orphan Purge: Purge any attendance records that belong to deleted/unknown mock employees (Rahul, Pooja, etc.)
          const savedEmployeesRaw = localStorage.getItem('pk_hr_employees');
          const savedEmployees: Employee[] = savedEmployeesRaw ? JSON.parse(savedEmployeesRaw) : [];
          const validEmployeeIds = new Set(savedEmployees.map((e) => e.id));

          const valid = parsed.filter(
            (r): r is AttendanceRecord =>
              Boolean(r && r.id && r.employeeId && validEmployeeIds.has(r.employeeId))
          );
          return valid;
        }
      }
    } catch {
      // fallback
    }

    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pk_hr_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('pk_hr_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // Face Enrollment Modal State
  const [enrollingEmployee, setEnrollingEmployee] = useState<Employee | null>(null);

  // Add new employee with strictly monotonic, collision-free ID generation
  const handleAddEmployee = (empData: Omit<Employee, 'id' | 'faceEnrolled' | 'faceDescriptors' | 'status'>) => {
    setEmployees((prev) => {
      let maxNum = 100;
      for (const e of prev) {
        const match = (e.id || '').match(/PK-EMP-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      const nextId = `PK-EMP-${String(maxNum + 1).padStart(4, '0')}`;
      const newEmp: Employee = {
        ...empData,
        id: nextId,
        faceEnrolled: false,
        status: 'ACTIVE',
      };
      return [newEmp, ...prev];
    });
  };

  // Save Face Descriptors with Encrypted Vault and Audit Logging
  const handleSaveFaceDescriptors = async (empId: string, descriptors: number[][], avatarUrl?: string) => {
    // 1. Save to encrypted IndexedDB Vault
    await biometricVault.saveEncryptedBiometrics(empId, descriptors, avatarUrl);

    // 2. Audit Trail
    const targetEmp = employees.find((e) => e.id === empId);
    recordBiometricAudit(
      'ENROLL',
      empId,
      targetEmp?.name || 'Staff',
      'HR Admin',
      `Enrolled biometric templates with AES-256 encryption. Examples: ${descriptors.length}`
    );

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId
          ? {
              ...e,
              faceEnrolled: true,
              faceDescriptors: descriptors,
              embeddingDimensions: descriptors[0]?.length === 512 ? 512 : 128,
              avatarUrl: avatarUrl || e.avatarUrl,
            }
          : e
      )
    );
  };

  // Delete Face Biometrics with Encrypted Purge and Audit Logging
  const handleDeleteFaceBiometrics = async (empId: string) => {
    // 1. Purge from Encrypted Vault
    await biometricVault.deleteBiometrics(empId);

    // 2. Audit Trail
    const targetEmp = employees.find((e) => e.id === empId);
    recordBiometricAudit(
      'DELETE',
      empId,
      targetEmp?.name || 'Staff',
      'HR Admin',
      'Permanent biometric deletion on employee departure / data consent revocation'
    );

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId
          ? {
              ...e,
              faceEnrolled: false,
              faceDescriptors: undefined,
              avatarUrl: undefined,
            }
          : e
      )
    );
  };

  // Record In / Out Punch from Terminal with Evidence Support
  const handleRecordPunch = (
    employee: Employee, 
    type: 'IN' | 'OUT', 
    locationStamp: LocationStamp,
    evidence?: PunchEvidenceMetadata
  ) => {
    if (!employee || !employee.id) return;

    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    setAttendanceRecords((prev) => {
      const safePrev = Array.isArray(prev) ? prev.filter((r): r is AttendanceRecord => Boolean(r && r.id)) : [];
      const existing = safePrev.find((r) => Boolean(r && r.employeeId === employee.id && r.date === today));

      if (type === 'OUT' && existing && existing.inTime) {
        // Rolling Update: Har baar jab camera ke aage aayega, outTime extend/update ho jayega
        const [inH, inM] = (existing.inTime || '09:00').split(':').map(Number);
        const [outH, outM] = timeStr.split(':').map(Number);
        const totalMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

        return safePrev.map((r) =>
          r && r.id === existing.id
            ? {
                ...r,
                outTime: timeStr,
                outLocation: locationStamp,
                outEvidence: evidence,
                totalWorkMinutes: totalMinutes,
                status: totalMinutes < 240 ? 'HALF_DAY' : r.status,
              }
            : r
        );
      } else if (!existing || !existing.inTime) {
        // Create new IN punch on new day or if no IN exists yet
        const isLate = timeStr > '09:15:00';
        const newRecord: AttendanceRecord = {
          id: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          employeeId: employee.id,
          employeeName: employee.name || 'Staff',
          department: employee.department || 'Operations',
          date: today,
          inTime: timeStr,
          inLocation: locationStamp,
          inEvidence: evidence,
          status: isLate ? 'LATE' : 'PRESENT',
          shiftName: employee.shift || 'General',
        };
        return [newRecord, ...safePrev];
      } else {
        // Fallback: If somehow type was 'IN' but record exists, update or return
        return safePrev;
      }
    });
  };

  // Manual Override from Register
  const handleManualOverride = (
    recordId: string, 
    inTime: string, 
    outTime: string, 
    reason: string
  ) => {
    const targetRec = attendanceRecords.find((r) => r.id === recordId);
    if (targetRec) {
      recordBiometricAudit(
        'MANUAL_OVERRIDE',
        targetRec.employeeId,
        targetRec.employeeName,
        'HR Manager',
        `Adjusted punch times: IN ${inTime || '--'} / OUT ${outTime || '--'}. Reason: ${reason}`
      );
    }

    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              inTime,
              outTime,
              isManualOverride: true,
              overrideReason: reason,
              overrideBy: 'HR Manager',
            }
          : r
      )
    );
  };

  const handleAddManualRecord = (newRec: Omit<AttendanceRecord, 'id'>) => {
    const record: AttendanceRecord = {
      ...newRec,
      id: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setAttendanceRecords((prev) => [record, ...prev]);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top HR Navigation Navigation Strip */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#fafafb] border border-[#ececec] rounded-[24px]">
        <button
          onClick={() => handleTabSwitch('TERMINAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'TERMINAL'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <ScanFace size={15} className={activeTab === 'TERMINAL' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Live Face Terminal</span>
        </button>

        <button
          onClick={() => handleTabSwitch('REGISTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'REGISTER'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <CalendarCheck size={15} className={activeTab === 'REGISTER' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Attendance Register</span>
        </button>

        <button
          onClick={() => handleTabSwitch('DIRECTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <Users size={15} className={activeTab === 'DIRECTORY' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Employee Master & Biometrics</span>
        </button>

        <button
          onClick={() => handleTabSwitch('LEAVE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'LEAVE'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <FileText size={15} className={activeTab === 'LEAVE' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Leave Sanctions (PK-HR-LV-01)</span>
        </button>

        <button
          onClick={() => handleTabSwitch('LAB')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'LAB'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <Activity size={15} className={activeTab === 'LAB' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Recognition Lab (Admin)</span>
        </button>

        <button
          onClick={() => handleTabSwitch('PAYROLL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'PAYROLL'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <DollarSign size={15} className={activeTab === 'PAYROLL' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Payroll & OT Wages</span>
        </button>

        <button
          onClick={() => handleTabSwitch('SHIFTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'SHIFTS'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <Clock size={15} className={activeTab === 'SHIFTS' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Shift Rules & Holidays</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'TERMINAL' && (
        <HRAttendanceTerminal
          employees={employees}
          attendanceRecords={attendanceRecords}
          onRecordPunch={handleRecordPunch}
        />
      )}

      {activeTab === 'REGISTER' && (
        <HRAttendanceRegister
          records={attendanceRecords}
          employees={employees}
          onManualOverride={handleManualOverride}
          onAddManualRecord={handleAddManualRecord}
        />
      )}

      {activeTab === 'DIRECTORY' && (
        <HREmployeeDirectory
          employees={employees}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={(updatedEmp) => {
            const updated = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
            setEmployees(updated);
            localStorage.setItem('pk_hr_employees', JSON.stringify(updated));
          }}
          onDeleteEmployee={async (empId) => {
            await biometricVault.deleteBiometrics(empId);
            const updated = employees.filter((e) => e.id !== empId);
            setEmployees(updated);
            localStorage.setItem('pk_hr_employees', JSON.stringify(updated));

            // CASCADE DELETE: Remove all attendance records of this deleted employee
            setAttendanceRecords((prevRecords) => {
              const cleanedRecords = prevRecords.filter((r) => r.employeeId !== empId);
              localStorage.setItem('pk_hr_attendance_records', JSON.stringify(cleanedRecords));
              return cleanedRecords;
            });
          }}
          onOpenFaceEnroll={(emp) => setEnrollingEmployee(emp)}
          onDeleteFaceBiometrics={handleDeleteFaceBiometrics}
        />
      )}

      {activeTab === 'LEAVE' && <HRLeaveView />}

      {activeTab === 'LAB' && <RecognitionLab employees={employees} />}

      {activeTab === 'PAYROLL' && (
        <HRPayrollView
          employees={employees}
          attendanceRecords={attendanceRecords}
          onUpdateEmployeeRate={(empId, newRate) => {
            const updated = employees.map((e) => (e.id === empId ? { ...e, dailyRate: newRate } : e));
            setEmployees(updated);
            localStorage.setItem('pk_portal_employees_v1', JSON.stringify(updated));
          }}
        />
      )}

      {activeTab === 'SHIFTS' && (
        <HRShiftSettings
          shifts={plantShifts}
          holidays={plantHolidays}
          onSaveShifts={(updatedShifts) => {
            setPlantShifts(updatedShifts);
            localStorage.setItem('pk_plant_shifts', JSON.stringify(updatedShifts));
          }}
          onSaveHolidays={(updatedHolidays) => {
            setPlantHolidays(updatedHolidays);
            localStorage.setItem('pk_plant_holidays', JSON.stringify(updatedHolidays));
          }}
        />
      )}

      {/* Face Enrollment Modal */}
      {enrollingEmployee && (
        <HREnrollFaceModal
          employee={enrollingEmployee}
          allEmployees={employees}
          isOpen={!!enrollingEmployee}
          onClose={() => setEnrollingEmployee(null)}
          onSaveFaceDescriptors={handleSaveFaceDescriptors}
        />
      )}
    </div>
  );
};
