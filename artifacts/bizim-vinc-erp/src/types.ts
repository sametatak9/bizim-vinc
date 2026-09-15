export type AppRole =
  | 'founder'
  | 'admin'
  | 'yonetici'
  | 'muhasebe'
  | 'puantor'
  | 'personel'
  | 'operasyon'
  | 'operator';

export const EMPLOYEE_SELF_SERVICE_ROLES: AppRole[] = ['personel', 'operator'];

export const isEmployeeSelfServiceRole = (role: AppRole): boolean =>
  EMPLOYEE_SELF_SERVICE_ROLES.includes(role);

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  phone?: string;
  department?: string;
  title?: string;
  personnelId?: string;
  avatarUrl?: string;
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
  employeeNo: string;
  fullName: string;
  tcNo?: string;
  phone: string;
  email?: string;
  address?: string;
  kind: PersonKind;
  personnelTypeId?: string;
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
  certificateExpiresAt?: string;
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PersonnelDocumentType = 'isg' | 'myk' | 'ehliyet' | 'src' | 'saglik' | 'adli_sicil' | 'isten_cikis' | 'diger';

export interface PersonnelDocument {
  id: string;
  personnelId: string;
  documentType: PersonnelDocumentType;
  fileName: string;
  storagePath: string;
  expiresAt?: string;
  isSensitive: boolean;
  createdAt: string;
}

export interface PersonnelType {
  id: string;
  name: string;
  isActive: boolean;
}

export type CraneStatus = 'sahada' | 'musait' | 'bakimda' | 'arizali' | 'pasif';

export interface Crane {
  id: string;
  code: string;
  type: string;
  status: CraneStatus;
  capacity: string;
  operator?: string;
  site?: string;
  lastService: string;
  lat: number;
  lng: number;
  meterHours?: number;
  nextServiceHours?: number;
  nextServiceDate?: string;
  telemetryProvider?: 'manual' | 'nav_api' | 'vakif_telematics';
  telemetryLastSeen?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApprovalKind =
  | 'yoklama' | 'mesai' | 'avans' | 'makbuz' | 'makbuz_onay' | 'uyelik_onay'
  | 'izin' | 'yakit' | 'genel' | 'vinc_hareket' | 'mesai_kaldi' | 'diger';

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

export type AttendanceStatus = 'geldi' | 'gelmedi' | 'izinli' | 'raporlu' | 'tatil' | 'eksik';

export interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
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
  startDate: string;
  endDate: string;
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
  date: string;
  startTime: string;
  endTime: string;
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
  requestDate: string;
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
  month: string;
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
  period: string;
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
  userId?: string;
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

export interface Customer {
  creditLimit?: number;
  riskStatus?: "normal" | "dikkat" | "riskli";
  isEfaturaMukellefi?: boolean;
  paymentTermDays?: number;
  id: string;
  title: string;
  name?: string;
  type?: 'musteri' | 'taseron' | 'diger';
  vknTckn?: string;
  taxNo?: string;
  contactName?: string;
  authorizedPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  taxOffice?: string;
  balance: number;
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

export interface Quote {
  id: string;
  quoteNo: string;
  customerId: string;
  customerName: string;
  siteName?: string;
  craneCode?: string;
  lines: JobReceiptLine[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: string;
  notes?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  siteName?: string;
  status: 'draft' | 'sent' | 'signed' | 'cancelled' | 'completed';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export type JobReceiptStatus =
  | 'draft' | 'pending' | 'pending_approval' | 'approved' | 'onaylandi' | 'rejected' | 'invoiced';

export interface JobReceiptLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface JobReceipt {
  id: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  siteId?: string;
  siteName?: string;
  craneCode: string;
  craneId?: string;
  operatorId?: string;
  operatorName: string;
  date: string;
  startTime?: string;
  endTime?: string;
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
  | 'draft' | 'issued' | 'gonderildi' | 'paid' | 'odendi' | 'partial' | 'cancelled';

export interface InvoiceLine {
  id?: string;
  invoiceId?: string;
  itemType: 'saatlik_kiralama' | 'gunluk_kiralama' | 'operator' | 'sefer' | 'yakit' | 'hasar' | 'diger';
  description: string;
  quantity: number;
  unit: 'saat' | 'gun' | 'sefer' | 'adet' | 'litre';
  unitPrice: number;
  taxRate: number;
  taxAmount?: number;
  totalAmount?: number;
  craneId?: string;
}

export interface PrintTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  headerColor: string;
  logoUrl?: string;
  footerNote?: string;
}

export interface Invoice {
  lines?: InvoiceLine[];
  printedAt?: string;
  templateId?: string;
  category?: string;
  eStatus?: "taslak" | "e-arsiv" | "e-fatura";
  withholdingRate?: number;
  withholdingAmount?: number;
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  receiptIds: string[];
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

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

export type PaymentCategory =
  | 'maas' | 'avans' | 'yakit' | 'bakim' | 'kira' | 'masraf' | 'leasing' | 'kredi'
  | 'kredi_karti' | 'petrol_dbs' | 'kdv_vergi' | 'elektrik_su' | 'diger';

export type PaymentChannel =
  | 'havale_eft' | 'otomatik_odeme' | 'dbs' | 'nakit' | 'cek' | 'senet'
  | 'kredi_karti' | 'pos' | 'mahsup' | 'virman' | 'diger';

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  havale_eft: 'Havale / EFT',
  otomatik_odeme: 'Otomatik Ödeme (Talimat)',
  dbs: 'DBS (Doğrudan Borçlandırma)',
  nakit: 'Nakit (Kasa)',
  cek: 'Çek',
  senet: 'Senet',
  kredi_karti: 'Kredi Kartı',
  pos: 'POS',
  mahsup: 'Mahsup / Takas',
  virman: 'Virman',
  diger: 'Diğer',
};

export const PAYMENT_CATEGORY_LABELS: Record<PaymentCategory, string> = {
  maas: 'Maaş', avans: 'Avans', yakit: 'Yakıt', bakim: 'Bakım / Servis',
  kira: 'Kira', masraf: 'Masraf', leasing: 'Leasing', kredi: 'Banka Kredisi',
  kredi_karti: 'Kredi Kartı', petrol_dbs: 'Petrol DBS', kdv_vergi: 'Vergi / SGK',
  elektrik_su: 'Elektrik / Su / Doğalgaz', diger: 'Diğer',
};

export interface Payment {
  id: string;
  recipientType: 'personel' | 'tedarikci' | 'diger';
  recipientId?: string;
  recipientName: string;
  category: PaymentCategory;
  amount: number;
  dueDate: string;
  paidDate?: string;
  paymentDate?: string;
  paymentMethod?: 'havale' | 'nakit' | 'kredi_karti';
  status: 'bekliyor' | 'odendi' | 'iptal';
  payrollItemId?: string;
  notes?: string;
  obligationId?: string;
  installmentNo?: number;
  installmentCount?: number;
  reminderDaysBefore?: number;
  recurring?: boolean;
  createdAt: string;
  periodMonth?: string;
  paidAmount?: number;
  paymentChannel?: PaymentChannel;
  bankAccount?: string;
  referenceNo?: string;
  institutionName?: string;
  invoiceNo?: string;
  documentPath?: string;
  currency?: string;
  receiptCount?: number;
  title?: string;
  kind?: string;
  externalImportKey?: string;
}

export interface PaymentObligation {
  id: string;
  title: string;
  category: PaymentCategory;
  recipientName: string;
  recipientId?: string;
  institutionName?: string;
  contractNo?: string;
  subscriberNo?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  plate?: string;
  craneId?: string;
  iban?: string;
  totalAmount: number;
  installmentCount: number;
  paymentDay?: number;
  startMonth?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  interestRate?: number;
  reminderDaysBefore?: number;
  recurring?: boolean;
  status?: string;
  source?: 'manuel' | 'fatura' | 'sozlesme' | 'ice_aktarim';
  sourceInvoiceId?: string;
  documentPath?: string;
  notes?: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface PaymentReceiptDoc {
  id: string;
  paymentId: string;
  obligationId?: string;
  docType: 'dekont' | 'fatura' | 'ekstre' | 'makbuz' | 'sozlesme' | 'diger';
  filePath: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  amount?: number;
  bankName?: string;
  referenceNo?: string;
  paidAt?: string;
  notes?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface PaymentSettlementInput {
  paidAmount: number;
  paymentChannel: PaymentChannel;
  paymentDate: string;
  bankAccount?: string;
  referenceNo?: string;
  institutionName?: string;
  invoiceNo?: string;
  notes?: string;
  docType?: PaymentReceiptDoc['docType'];
  file: File;
}

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

export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface PayrollRun {
  id: string;
  month: string;
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

export interface PayrollPayment {
  id: string;
  payrollItemId: string;
  payrollRunId: string;
  personnelId: string;
  amount: number;
  paymentMethod: 'banka' | 'nakit';
  paymentDate: string;
  note?: string;
  paidBy?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'yakit' | 'masraf' | 'servis' | 'muayene' | 'yag_bakimi';
  title: string;
  detail?: string;
  amount: number;
  craneCode?: string;
  personName?: string;
  stationOrSupplier?: string;
  meterReading?: number;
  serviceDueDate?: string;
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

export type CommercialPaperType = 'alinan_cek' | 'verilen_cek' | 'alinan_senet' | 'verilen_senet';
export type CommercialPaperStatus = 'portfoyde' | 'ciro_edildi' | 'tahsile_verildi' | 'odendi_tahsil' | 'karsiliksiz_protesto' | 'iade_edildi';

export interface CommercialPaper {
  id: string;
  type: CommercialPaperType;
  documentNo: string;
  serialNo?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  debtor: string;
  debtorTaxId?: string;
  beneficiary: string;
  endorser?: string;
  bankName?: string;
  bankBranch?: string;
  accountNo?: string;
  city?: string;
  status: CommercialPaperStatus;
  notes?: string;
  documentUrl?: string;
  statusDate?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
