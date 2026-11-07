import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ScanFace, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Building2, 
  Clock, 
  Phone, 
  Mail, 
  Plus, 
  X,
  Camera,
  Trash2,
  Edit2,
  DollarSign
} from 'lucide-react';
import { Employee } from '../../types/hrAttendanceTypes';

interface HREmployeeDirectoryProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id' | 'faceEnrolled' | 'faceDescriptors' | 'status'>) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onOpenFaceEnroll: (emp: Employee) => void;
  onDeleteFaceBiometrics?: (empId: string) => void;
}

export const HREmployeeDirectory: React.FC<HREmployeeDirectoryProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onOpenFaceEnroll,
  onDeleteFaceBiometrics,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [enrollFilter, setEnrollFilter] = useState<'ALL' | 'ENROLLED' | 'PENDING'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State for Adding/Editing Employee
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('Liquid Coating');
  const [shift, setShift] = useState<Employee['shift']>('General (09:00 - 18:00)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dailyRate, setDailyRate] = useState<number>(750);
  const [isOtEligible, setIsOtEligible] = useState<boolean>(true);
  const [joinDate, setJoinDate] = useState(() => new Date().toISOString().split('T')[0]);

  const openAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setDesignation('');
    setDepartment('Liquid Coating');
    setShift('General (09:00 - 18:00)');
    setPhone('');
    setEmail('');
    setDailyRate(750);
    setIsOtEligible(true);
    setJoinDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setDesignation(emp.designation);
    setDepartment(emp.department);
    setShift(emp.shift);
    setPhone(emp.phone);
    setEmail(emp.email);
    setDailyRate(emp.dailyRate || 750);
    setIsOtEligible(emp.isOtEligible !== false);
    setJoinDate(emp.joinDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const filteredEmployees = (employees || []).filter((emp) => {
    if (!emp || !emp.id) return false;
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesEnroll =
      enrollFilter === 'ALL' ||
      (enrollFilter === 'ENROLLED' && emp.faceEnrolled) ||
      (enrollFilter === 'PENDING' && !emp.faceEnrolled);

    return matchesSearch && matchesDept && matchesEnroll;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingEmployee && onUpdateEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        name: name.trim(),
        designation: designation.trim() || 'Production Operator',
        department,
        shift,
        phone: phone.trim() || '+91 98000 00000',
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@paintking.in`,
        dailyRate: Number(dailyRate) || 750,
        isOtEligible,
        joinDate,
      });
    } else {
      onAddEmployee({
        name: name.trim(),
        designation: designation.trim() || 'Production Operator',
        department,
        shift,
        phone: phone.trim() || '+91 98000 00000',
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@paintking.in`,
        dailyRate: Number(dailyRate) || 750,
        isOtEligible,
        joinDate,
      });
    }

    // Reset & close
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const totalEnrolled = employees.filter((e) => e.faceEnrolled).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-[#ececec] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
              PK-OS Human Resources
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
              Master Roster
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] mt-1">
            Employee Directory & Biometrics
          </h2>
          <p className="text-xs text-[#777b86] mt-0.5">
            Total Workforce: <strong className="text-[#17191c]">{employees.length}</strong> | Face Enrolled: <strong className="text-[#c09748]">{totalEnrolled}</strong> ({Math.round((totalEnrolled / (employees.length || 1)) * 100)}%)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus size={15} className="text-[#c09748]" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#979799]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Employee ID, Name, or Role..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] shadow-2xs"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Liquid Coating">Liquid Spray Painting</option>
            <option value="Hydrographics">Hydrographics (3D Dipping)</option>
            <option value="UV Digital">UV Digital Flatbed</option>
            <option value="Injection Moulding">Injection Moulding</option>
            <option value="Quality Assurance">Quality Assurance (QA)</option>
            <option value="Administration">Administration</option>
            <option value="HR">Human Resources</option>
            <option value="Maintenance">Maintenance & Tooling</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex gap-1 p-1 bg-[#fafafb] border border-[#ececec] rounded-[16px]">
          <button
            onClick={() => setEnrollFilter('ALL')}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[12px] transition cursor-pointer ${
              enrollFilter === 'ALL' ? 'bg-white text-[#17191c] shadow-2xs' : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setEnrollFilter('ENROLLED')}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[12px] transition cursor-pointer ${
              enrollFilter === 'ENROLLED' ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Enrolled
          </button>
          <button
            onClick={() => setEnrollFilter('PENDING')}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[12px] transition cursor-pointer ${
              enrollFilter === 'PENDING' ? 'bg-[#fff1f2] text-[#9f1239] border border-[#fecdd3]' : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="p-5 bg-white rounded-[24px] border border-[#ececec] shadow-2xs hover:border-[#c09748]/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Avatar & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt={emp.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-[#8a6521]">
                        {emp.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-[#c09748] tracking-wider uppercase block">
                      {emp.id}
                    </span>
                    <h3 className="text-sm font-semibold text-[#17191c] leading-tight mt-0.5">
                      {emp.name}
                    </h3>
                    <p className="text-[11px] text-[#777b86] flex items-center gap-1 mt-0.5">
                      <Briefcase size={12} className="text-[#979799]" />
                      <span>{emp.designation}</span>
                    </p>
                  </div>
                </div>

                {emp.faceEnrolled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shrink-0">
                    <CheckCircle2 size={12} />
                    <span>Enrolled</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#fef2f2] text-[#991b1b] border border-[#fee2e2] shrink-0">
                    <AlertCircle size={12} />
                    <span>Pending</span>
                  </span>
                )}
              </div>

              {/* Meta details */}
              <div className="mt-4 pt-3 border-t border-[#f2f2f3] space-y-1.5 text-[11px] text-[#777b86]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-[#979799]" />
                    <span>Department:</span>
                  </span>
                  <strong className="text-[#17191c] font-medium">{emp.department}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#979799]" />
                    <span>Shift:</span>
                  </span>
                  <span className="text-[#17191c] font-medium truncate max-w-[170px]" title={emp.shift}>
                    {emp.shift}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-[#979799]" />
                    <span>Phone:</span>
                  </span>
                  <span className="text-[#17191c]">{emp.phone}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#f2f2f3]">
                  <span className="flex items-center gap-1.5 text-[#c09748] font-semibold">
                    <DollarSign size={12} />
                    <span>Wage Rate:</span>
                  </span>
                  <span className="text-[#17191c] font-bold">₹ {emp.dailyRate || 750} / day</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-[#f2f2f3] flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#979799]">
                Joined: {emp.joinDate}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(emp)}
                  title="Edit Profile & Salary Rate"
                  className="p-1.5 text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] border border-[#dcdfe4] rounded-full transition cursor-pointer"
                >
                  <Edit2 size={13} />
                </button>

                {onDeleteEmployee && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete employee profile ${emp.name} (${emp.id})?`)) {
                        onDeleteEmployee(emp.id);
                      }
                    }}
                    title="Delete Entire Employee Profile"
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-full transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  onClick={() => onOpenFaceEnroll(emp)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition cursor-pointer ${
                    emp.faceEnrolled
                      ? 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#17191c] border-[#dcdfe4]'
                      : 'bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border-[#f4e5be] shadow-2xs active:scale-95'
                  }`}
                >
                  <Camera size={13} className={emp.faceEnrolled ? 'text-[#777b86]' : 'text-[#c09748]'} />
                  <span>{emp.faceEnrolled ? 'Re-Scan Face' : 'Enroll Face'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-[24px] border border-dashed border-[#dcdfe4]">
            <Users size={32} className="mx-auto text-[#979799] mb-3" />
            <h3 className="text-sm font-semibold text-[#17191c]">No employees matched your criteria</h3>
            <p className="text-xs text-[#777b86] mt-1">Try adjusting your search query or department filters.</p>
          </div>
        )}
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#17191c]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#ececec] flex items-center justify-between bg-[#fafafb]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748] block">
                  PaintKing Staff Registry
                </span>
                <h3 className="text-lg font-serif text-[#17191c] mt-0.5">
                  {editingEmployee ? `Edit Profile: ${editingEmployee.name}` : 'Onboard New Employee'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-[#ececec] text-[#777b86] hover:text-[#17191c] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Verma"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Sr. Spray Painter"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Employee['department'])}
                    className="w-full px-3 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] focus:bg-white cursor-pointer"
                  >
                    <option value="Liquid Coating">Liquid Coating</option>
                    <option value="Hydrographics">Hydrographics (3D Dipping)</option>
                    <option value="UV Digital">UV Digital Flatbed</option>
                    <option value="Injection Moulding">Injection Moulding</option>
                    <option value="Quality Assurance">Quality Assurance (QA)</option>
                    <option value="Administration">Administration</option>
                    <option value="HR">Human Resources</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Assigned Shift *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as Employee['shift'])}
                    className="w-full px-3 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] focus:bg-white cursor-pointer"
                  >
                    <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
                    <option value="Morning Shift A (06:00 - 14:30)">Morning Shift A (06:00 - 14:30)</option>
                    <option value="Evening Shift B (14:00 - 22:30)">Evening Shift B (14:00 - 22:30)</option>
                    <option value="Night Shift C (22:00 - 06:30)">Night Shift C (22:00 - 06:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 95945 91313"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Daily Wage Rate (₹ / Day) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    placeholder="750"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] font-semibold focus:outline-none focus:border-[#c09748] focus:bg-white"
                  />
                  <span className="text-[10px] text-[#979799]">Base pay for 8-hour shift</span>
                </div>
              </div>

              {/* OVERTIME (OT) ELIGIBILITY TOGGLE */}
              <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#17191c]">Overtime (OT) Eligible</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                      {isOtEligible ? 'Enabled (Default)' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777b86] mt-0.5">
                    {isOtEligible
                      ? `Extra hours calculated proportionately (₹${Math.round(dailyRate / 8)}/hr based on ₹${dailyRate}/8h)`
                      : 'Fixed pay only, extra hours will not generate OT earnings'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isOtEligible}
                    onChange={(e) => setIsOtEligible(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#dcdfe4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#ececec] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c09748]" />
                </label>
              </div>

              <div className="pt-4 border-t border-[#ececec] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#777b86] hover:text-[#17191c] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} className="text-[#c09748]" />
                  <span>{editingEmployee ? 'Update Profile & Salary' : 'Register Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
