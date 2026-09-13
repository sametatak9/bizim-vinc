export type AppRole =
  | 'founder'
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
  | 'makbuz_onay'
  | 'uyelik_onay'
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

// -------------------------------------------------------------
// CARİ (CUSTOMERS) & ŞANTİYELER
// -------------------------------------------------------------
export interface Customer {
  id: string;
  title: string; // Ünvan
  name?: string; // alias for title
  type?: 'musteri' | 'taseron' | 'diger';
  vknTckn?: string; // VKN / TCKN
  taxNo?: string; // alias for vknTckn
  contactName?: string; // alias for authorizedPerson
  authorizedPerson?: string; // Yetkili kişi
  phone: string;
  email?: string;
  address?: string;
  taxOffice?: string;
  balance: number; // Cari Bakiye (Pozitif: Alacaklıyız, Negatif: Borçluyuz)
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Site {
  id: string;
  name: string;
  customerId?: string;
  customerName?: string;
  location?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  phone?: string;
  status: 'aktif' | 'tamamlandi' | 'askida';
  createdAt: string;
}

// -------------------------------------------------------------
// MAKBUZ (JOB RECEIPT) & FATURA (INVOICE) HATTI
// -------------------------------------------------------------
export type JobReceiptStatus =
  | 'draft'
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'onaylandi'
  | 'rejected'
  | 'invoiced';

export interface JobReceiptLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface JobReceipt {
  id: string;
  receiptNo: string; // e.g. MB-2026-0042
  customerId: string;
  customerName: string;
  siteId?: string;
  siteName?: string;
  craneCode: string;
  craneId?: string;
  operatorId?: string;
  operatorName: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  workingHours?: number;
  hoursWorked?: number;
  hourlyRate?: number;
  signedByCustomer?: boolean;
  customerSignatureName?: string;
  description?: string;
  lines?: JobReceiptLine[];
  amount: number;
  status: JobReceiptStatus;
  invoiced: boolean;
  invoiceId?: string;
  invoiceNo?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'gonderildi'
  | 'paid'
  | 'odendi'
  | 'partial'
  | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNo: string; // e.g. FT-2026-0015
  customerId: string;
  customerName: string;
  receiptIds: string[]; // Bağlı makbuz ID'leri
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number; // e.g. 20
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// TAHSİLATLAR (COLLECTIONS) & ÖDEMELER (PAYMENTS)
// -------------------------------------------------------------
export interface Collection {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNo?: string;
  amount: number;
  dueDate?: string;
  date: string;
  paymentMethod: 'havale' | 'nakit' | 'cek' | 'kredi_karti';
  status: 'bekliyor' | 'tahsil_edildi' | 'iptal';
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  recipientType: 'personel' | 'tedarikci' | 'diger';
  recipientId?: string;
  recipientName: string;
  category: 'maas' | 'avans' | 'yakit' | 'bakim' | 'kira' | 'masraf' | 'diger';
  amount: number;
  dueDate: string;
  paidDate?: string;
  paymentDate?: string;
  paymentMethod?: 'havale' | 'nakit' | 'kredi_karti';
  status: 'bekliyor' | 'odendi' | 'iptal';
  payrollItemId?: string;
  notes?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// ÜYELİK & PERSONEL EŞLEŞTİRME
// -------------------------------------------------------------
export type MembershipStatus = 'pending' | 'approved' | 'rejected';

export interface Membership {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  requestedRole: AppRole;
  personnelId?: string;
  matchedPersonnelName?: string;
  tcHashOrNo?: string;
  status: MembershipStatus;
  approvalRequestId?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// MAAŞ HESAPLAMA & BORDRO (PAYROLL)
// -------------------------------------------------------------
export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface PayrollRun {
  id: string;
  month: string; // YYYY-MM
  totalPersons?: number;
  personCount?: number;
  totalGross?: number;
  totalBaseSalary?: number;
  totalNet?: number;
  totalNetSalary?: number;
  totalOvertimePay: number;
  totalAdvancesDeducted?: number;
  status: PayrollStatus;
  calculatedAt?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paymentDate?: string;
  paymentMethod?: 'banka' | 'nakit';
  paidBy?: string;
}

export interface PayrollItem {
  id: string;
  runId?: string;
  payrollRunId?: string;
  month?: string;
  personId?: string;
  personnelId?: string;
  personName?: string;
  personnelName?: string;
  employeeNo?: string;
  roleKind?: string;
  title?: string;
  iban?: string;
  baseSalary: number;
  workDays?: number;
  normalDays?: number;
  normalHours?: number;
  overtimeHours: number;
  overtimePay: number;
  bonus?: number;
  advancesDeduction: number;
  otherDeductions?: number;
  netSalary: number;
  status: PayrollStatus;
  paymentMethod?: 'banka' | 'nakit';
  paidAt?: string;
  notes?: string;
  createdAt?: string;
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
