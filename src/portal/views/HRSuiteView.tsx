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
import { HRLeaveView } from './HRLeaveView';
import { 
  Employee, 
  AttendanceRecord, 
  LocationStamp,
  PunchEvidenceMetadata
} from '../types/hrAttendanceTypes';
import { biometricVault, recordBiometricAudit } from '../services/secureBiometricStorage';

// Initial Mock Employees for PaintKing
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'PK-EMP-0101',
    name: 'Rahul Sharma',
    designation: 'Senior Spray Coater',
    department: 'Liquid Coating',
    shift: 'General (09:00 - 18:00)',
    phone: '+91 95945 91313',
    email: 'rahul.s@paintking.in',
    joinDate: '2023-04-15',
    faceEnrolled: false,
    status: 'ACTIVE',
  },
  {
    id: 'PK-EMP-0102',
    name: 'Pooja Vishwakarma',
    designation: 'Quality Control Inspector',
    department: 'Quality Assurance',
    shift: 'Morning Shift A (06:00 - 14:30)',
    phone: '+91 98200 45678',
    email: 'pooja.v@paintking.in',
    joinDate: '2024-01-10',
    faceEnrolled: false,
    status: 'ACTIVE',
  },
  {
    id: 'PK-EMP-0103',
    name: 'Amit Patel',
    designation: 'Hydrographic Dipping Specialist',
    department: 'Hydrographics',
    shift: 'General (09:00 - 18:00)',
    phone: '+91 91678 12345',
    email: 'amit.p@paintking.in',
    joinDate: '2022-08-01',
    faceEnrolled: false,
    status: 'ACTIVE',
  },
  {
    id: 'PK-EMP-0104',
    name: 'Suresh Chauhan',
    designation: 'Injection Moulding Operator',
    department: 'Injection Moulding',
    shift: 'Evening Shift B (14:00 - 22:30)',
    phone: '+91 98920 87654',
    email: 'suresh.c@paintking.in',
    joinDate: '2023-11-20',
    faceEnrolled: false,
    status: 'ACTIVE',
  },
];

export const HRSuiteView: React.FC = () => {
  const { activeSubTab } = usePortalStore();
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'REGISTER' | 'DIRECTORY' | 'LEAVE' | 'LAB' | 'PAYROLL'>(() => {
    if (activeSubTab === 'LEAVE_APP') return 'LEAVE';
    if (activeSubTab === 'ATTENDANCE') return 'TERMINAL';
    if (activeSubTab === 'ROSTER') return 'REGISTER';
    return 'TERMINAL';
  });

  // Sync subTab from Sidebar navigation
  useEffect(() => {
    if (activeSubTab === 'LEAVE_APP') {
      setActiveTab('LEAVE');
    } else if (activeSubTab === 'ATTENDANCE') {
      setActiveTab('TERMINAL');
    } else if (activeSubTab === 'ROSTER') {
      setActiveTab('REGISTER');
    }
  }, [activeSubTab]);

  // Load from localStorage or initialize with strict validation
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('pk_hr_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((e): e is Employee => Boolean(e && e.id && e.name));
          if (valid.length > 0) return valid;
        }
      }
      return INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pk_hr_attendance_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((r): r is AttendanceRecord => Boolean(r && r.id && r.employeeId));
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      // fallback
    }

    // Default mock records for today
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: `REC-${Date.now()}-1`,
        employeeId: 'PK-EMP-0101',
        employeeName: 'Rahul Sharma',
        department: 'Liquid Coating',
        date: today,
        inTime: '08:54:12',
        shiftName: 'General (09:00 - 18:00)',
        status: 'PRESENT',
        inLocation: {
          lat: 19.2094833,
          lng: 72.8256194,
          accuracy: 8,
          distanceToHQ: 14,
          isHQVerified: true,
          locationName: 'Mumbai Head Office & R&D Lab',
        },
      },
      {
        id: `REC-${Date.now()}-2`,
        employeeId: 'PK-EMP-0102',
        employeeName: 'Pooja Vishwakarma',
        department: 'Quality Assurance',
        date: today,
        inTime: '09:22:45',
        shiftName: 'Morning Shift A (06:00 - 14:30)',
        status: 'LATE',
        inLocation: {
          lat: 19.2094833,
          lng: 72.8256194,
          accuracy: 12,
          distanceToHQ: 22,
          isHQVerified: true,
          locationName: 'Mumbai Head Office & R&D Lab',
        },
      },
    ];
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

  // Add new employee
  const handleAddEmployee = (empData: Omit<Employee, 'id' | 'faceEnrolled' | 'faceDescriptors' | 'status'>) => {
    const nextNum = employees.length + 101;
    const newEmp: Employee = {
      ...empData,
      id: `PK-EMP-${String(nextNum).padStart(4, '0')}`,
      faceEnrolled: false,
      status: 'ACTIVE',
    };
    setEmployees((prev) => [newEmp, ...prev]);
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

      if (type === 'OUT' && existing) {
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
      } else {
        // Create new IN punch
        // Check if late (after 09:15 for general shift)
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
          onClick={() => setActiveTab('TERMINAL')}
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
          onClick={() => setActiveTab('REGISTER')}
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
          onClick={() => setActiveTab('DIRECTORY')}
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
          onClick={() => setActiveTab('LEAVE')}
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
          onClick={() => setActiveTab('LAB')}
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
          onClick={() => setActiveTab('PAYROLL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'PAYROLL'
              ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          <DollarSign size={15} className={activeTab === 'PAYROLL' ? 'text-[#c09748]' : 'text-[#979799]'} />
          <span>Payroll & OT Wages</span>
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
