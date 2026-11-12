import { PlantLocation, PortalUserAccount, UserProfile, UserRole } from '../types/portalTypes';

export interface ErpModuleOption {
  id: string;
  label: string;
  description: string;
  docCode: string;
  superAdminOnly?: boolean;
}

export const ERP_MODULE_CATALOG: ErpModuleOption[] = [
  {
    id: 'dashboard',
    label: 'Executive Cockpit',
    description: 'Plant KPI, production priority allocation & EOD closures',
    docCode: 'PK-SYS-DSH-001',
  },
  {
    id: 'gatepass',
    label: 'Gate Pass Security',
    description: 'Inward, Outward & Vehicle Gate Passes',
    docCode: 'PK-ADM-GTP-001',
  },
  {
    id: 'stores',
    label: 'Stores & Inward GRN',
    description: 'Stock batches, FIFO/FEFO, MRN issue & floor returns',
    docCode: 'PK-STR-GRN-001',
  },
  {
    id: 'jobcards',
    label: 'Job Cards & Batches',
    description: 'Production scheduling, booths, painters & batch logs',
    docCode: 'PK-PRD-JCR-001',
  },
  {
    id: 'painter_desk',
    label: 'Painter Floor Desk',
    description: 'Booth touch kiosk, start/finish & verification queue',
    docCode: 'PK-PRD-FLR-001',
  },
  {
    id: 'handovers',
    label: 'Stage Handover',
    description: 'Inter-stage custody & count discrepancy tracking',
    docCode: 'PK-PRD-HND-001',
  },
  {
    id: 'qa',
    label: 'Quality Assurance (QA Hub)',
    description: 'IQC, PIR, FPA, IPQC, OQC, PDI, 8D CAPA & MNC Audit',
    docCode: 'PK-QA-001',
  },
  {
    id: 'calibration',
    label: 'Equipment Calibration',
    description: 'NABL certified gauges, DFT & spectrophotometer register',
    docCode: 'PK-MTN-CAL-01',
  },
  {
    id: 'packing',
    label: 'Packing & Box QR',
    description: 'Carton box splitting, QR labels & traceability',
    docCode: 'PK-STR-PKG-001',
  },
  {
    id: 'billing',
    label: 'Billing & PO Rec',
    description: 'Tax invoices, delivery challans & PO reconciliation',
    docCode: 'PK-ACC-INV-001',
  },
  {
    id: 'hr_leave',
    label: 'Human Resources & Admin',
    description: 'Face attendance terminal, employee master, payroll & leaves',
    docCode: 'PK-HR-LV-01',
  },
  {
    id: 'user_management',
    label: 'Users & Access Control',
    description: 'Create @paintking.in accounts, assign plants & module permissions',
    docCode: 'PK-SYS-USR-001',
    superAdminOnly: true,
  },
];

export const ALL_STANDARD_MODULE_IDS = ERP_MODULE_CATALOG
  .filter(m => !m.superAdminOnly)
  .map(m => m.id);

export const ALL_MODULE_IDS = ERP_MODULE_CATALOG.map(m => m.id);

export const ROLE_PRESETS: Record<UserRole, { label: string; defaultTitle: string; defaultModules: string[] }> = {
  SUPER_ADMIN: {
    label: 'Super Admin (Root Access)',
    defaultTitle: 'System Super Admin & Root Controller',
    defaultModules: ALL_MODULE_IDS,
  },
  DIRECTOR: {
    label: 'Director',
    defaultTitle: 'Managing / Executive Director',
    defaultModules: ALL_STANDARD_MODULE_IDS,
  },
  PLANT_HEAD: {
    label: 'Plant Head',
    defaultTitle: 'Plant Head Operations',
    defaultModules: ALL_STANDARD_MODULE_IDS,
  },
  STORES: {
    label: 'Stores Incharge',
    defaultTitle: 'Stores & Material Inward Incharge',
    defaultModules: ['stores', 'gatepass', 'packing', 'handovers', 'calibration', 'hr_leave'],
  },
  PRODUCTION: {
    label: 'Production Supervisor',
    defaultTitle: 'Senior Production Supervisor',
    defaultModules: ['jobcards', 'painter_desk', 'handovers', 'packing', 'calibration', 'hr_leave'],
  },
  MANAGER_QA: {
    label: 'Manager QA',
    defaultTitle: 'Head of Quality Assurance & Compliance',
    defaultModules: ['qa', 'calibration', 'jobcards', 'packing', 'hr_leave'],
  },
  QA_QC: {
    label: 'QA / QC Inspector',
    defaultTitle: 'Quality Control Inspector',
    defaultModules: ['qa', 'calibration', 'jobcards', 'packing', 'hr_leave'],
  },
  IQC_INSPECTOR: {
    label: 'IQC Inspector',
    defaultTitle: 'Incoming Quality Inspector',
    defaultModules: ['qa', 'hr_leave'],
  },
  FPA_IPQC_INSPECTOR: {
    label: 'FPA / IPQC Inspector',
    defaultTitle: 'In-Process Quality Inspector',
    defaultModules: ['qa', 'jobcards', 'hr_leave'],
  },
  OQC_PDI_INSPECTOR: {
    label: 'OQC / PDI Inspector',
    defaultTitle: 'Final Release Quality Inspector',
    defaultModules: ['qa', 'packing', 'hr_leave'],
  },
  BILLING: {
    label: 'Billing & Accounts',
    defaultTitle: 'Billing & Commercial Accounts Desk',
    defaultModules: ['billing', 'hr_leave'],
  },
  SECURITY: {
    label: 'Gate Security',
    defaultTitle: 'Main Gate Security Officer',
    defaultModules: ['gatepass', 'hr_leave'],
  },
  OPERATOR: {
    label: 'Painter / Line Operator',
    defaultTitle: 'Floor Coating Operator',
    defaultModules: ['painter_desk', 'jobcards', 'hr_leave'],
  },
  HR: {
    label: 'HR Administration',
    defaultTitle: 'Human Resources & Plant Administration',
    defaultModules: ['hr_leave'],
  },
  DEPT_INCHARGE: {
    label: 'Department Incharge',
    defaultTitle: 'Department Incharge',
    defaultModules: ['jobcards', 'painter_desk', 'hr_leave'],
  },
};

export const ROLE_DEFAULT_TABS: Record<UserRole, string> = {
  SUPER_ADMIN: 'user_management',
  DIRECTOR: 'dashboard',
  PLANT_HEAD: 'dashboard',
  STORES: 'stores',
  PRODUCTION: 'jobcards',
  QA_QC: 'qa',
  BILLING: 'billing',
  SECURITY: 'gatepass',
  IQC_INSPECTOR: 'qa',
  FPA_IPQC_INSPECTOR: 'qa',
  OQC_PDI_INSPECTOR: 'qa',
  MANAGER_QA: 'qa',
  OPERATOR: 'painter_desk',
  HR: 'hr_leave',
  DEPT_INCHARGE: 'hr_leave',
};

export function normalizePortalEmail(rawInput: string): string {
  const cleaned = rawInput.trim().toLowerCase();
  if (!cleaned) return '';
  if (cleaned.includes('@')) return cleaned;
  return `${cleaned}@paintking.in`;
}

export function canAccessPortalTab(user: UserProfile, tab: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (tab === 'user_management') return false;

  if (Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    return user.allowedModules.includes(tab);
  }

  const preset = ROLE_PRESETS[user.role];
  return preset ? preset.defaultModules.includes(tab) : false;
}

export function getDefaultTabForUser(user: UserProfile): string {
  const roleDefault = ROLE_DEFAULT_TABS[user.role] || 'hr_leave';
  if (canAccessPortalTab(user, roleDefault)) return roleDefault;

  if (Array.isArray(user.allowedModules)) {
    const firstAllowed = user.allowedModules.find(m => canAccessPortalTab(user, m));
    if (firstAllowed) return firstAllowed;
  }

  return 'hr_leave';
}

export function mapDbRowToPortalAccount(row: Record<string, unknown>): PortalUserAccount {
  const rawPlant = String(row.plant || 'Haridwar');
  const plant: PlantLocation | 'ALL' =
    rawPlant === 'ALL' || rawPlant === 'Haridwar' || rawPlant === 'Vasai' || rawPlant === 'Vapi' || rawPlant === 'Mumbai'
      ? rawPlant
      : 'Haridwar';

  const rawRole = String(row.role || 'OPERATOR') as UserRole;
  const role: UserRole = rawRole in ROLE_PRESETS ? rawRole : 'OPERATOR';

  const modules = Array.isArray(row.allowed_modules)
    ? row.allowed_modules.map(m => String(m))
    : ROLE_PRESETS[role].defaultModules;

  return {
    id: String(row.id || ''),
    email: String(row.email || ''),
    fullName: String(row.full_name || 'PaintKing Staff'),
    role,
    roleTitle: String(row.role_title || ROLE_PRESETS[role].defaultTitle),
    plant,
    allowedModules: modules,
    isActive: row.is_active !== false,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function mapAccountToUserProfile(account: PortalUserAccount): UserProfile {
  const effectivePlant: PlantLocation = account.plant === 'ALL' ? 'Haridwar' : account.plant;
  const initials = encodeURIComponent(account.fullName || 'PK');
  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    role: account.role,
    roleTitle: account.roleTitle,
    plant: effectivePlant,
    assignedPlant: account.plant,
    allowedModules: account.allowedModules,
    isActive: account.isActive,
    avatar: `https://ui-avatars.com/api/?name=${initials}&background=faf3e0&color=8a6521&bold=true`,
  };
}
