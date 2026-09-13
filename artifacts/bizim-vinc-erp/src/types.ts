export type AppRole =
  | 'admin'
  | 'yonetici'
  | 'muhasebe'
  | 'puantor'
  | 'personel'
  | 'operasyon'
  | 'operator';

export interface UserProfile {
  id: string; // auth.users id
  email: string;
  fullName: string;
  role: AppRole;
  phone?: string;
  department?: string;
  title?: string;
  personnelId?: string; // linked to Person
  status: 'aktif' | 'pasif';
  lastSignIn?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PersonKind = 'operator' | 'yardimci' | 'idari';
export type PersonStatus = 'aktif' | 'izinli' | 'pasif';
export type PoolStatus = 'gorevli' | 'musait' | 'havuzda';

export interface Person {
  id: string;
  employeeNo: string; // e.g. OP-204
  fullName: string;
  tcNo?: string;
  phone: string;
  email?: string;
  address?: string;
  kind: PersonKind;
  status: PersonStatus;
  poolStatus: PoolStatus;
  department?: string;
  salary?: number;
  iban?: string;
  startDate?: string;
  endDate?: string;
  title: string;
  initials: string;
  cardSlug?: string;
  documentsOk: boolean;
  certExpiring: boolean;
  notes?: string;
  userId?: string; // linked user profile
  createdAt?: string;
  updatedAt?: string;
}

export type CraneStatus = 'sahada' | 'musait' | 'bakimda' | 'arizali' | 'pasif';

export interface Crane {
  id: string;
  code: string; // e.g. V-204
  type: string;
  status: CraneStatus;
  capacity: string;
  operator?: string;
  site?: string;
  lastService: string;
  lat: number;
  lng: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApprovalKind =
  | 'yoklama'
  | 'mesai'
  | 'avans'
  | 'makbuz'
  | 'izin'
  | 'yakit'
  | 'genel'
  | 'vinc_hareket'
  | 'mesai_kaldi'
  | 'diger';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Approval {
  id: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  title: string;
  personId?: string;
  personName: string;
  personInitials?: string;
  relatedLabel?: string;
  amount?: number;
  requestedDate?: string;
  startDate?: string;
  endDate?: string;
  hours?: number;
  note?: string;
  decisionNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus =
  | 'geldi'
  | 'gelmedi'
  | 'izinli'
  | 'raporlu'
  | 'tatil'
  | 'eksik';

export interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm
  checkOutTime?: string; // HH:mm
  status: AttendanceStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeaveType = 'yillik' | 'mazeret' | 'rapor' | 'ucretsiz';

export interface LeaveRequest {
  id: string;
  personId: string;
  personName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  description?: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type OvertimeType = 'hafta_ici' | 'hafta_sonu' | 'resmi_tatil';

export interface OvertimeRecord {
  id: string;
  personId: string;
  personName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalHours: number;
  overtimeType: OvertimeType;
  description?: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvanceRequest {
  id: string;
  personId: string;
  personName: string;
  amount: number;
  requestDate: string; // YYYY-MM-DD
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PuantajRecord {
  id: string;
  month: string; // YYYY-MM
  personId: string;
  personName: string;
  title: string;
  workDays: number;
  normalHours: number;
  overtimeHours: number;
  leaveDays: number;
  sickDays: number;
  missingDays: number;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PuantajPeriodLock {
  period: string; // YYYY-MM
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  userRole?: string;
  action: string;
  module: string;
  recordId?: string;
  details?: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // target user or all
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedUrl?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  company: string;
  amount: number;
  status: 'kesildi' | 'birikti' | 'bekliyor' | 'iptal';
  craneCode?: string;
  site?: string;
  daysPending?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  category: 'yakit' | 'masraf';
  title: string;
  detail?: string;
  amount: number;
  craneCode?: string;
  personName?: string;
  stationOrSupplier?: string;
  status?: 'aktif' | 'iptal';
  createdAt: string;
  updatedAt?: string;
}

export interface TelemetryPoint {
  id: string;
  code: string;
  name: string;
  status: CraneStatus;
  lat: number;
  lng: number;
  operator?: string;
  site?: string;
}

