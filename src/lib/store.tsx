import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Person,
  Crane,
  CraneStatus,
  Approval,
  Receipt,
  Expense,
  TelemetryPoint,
  UserProfile,
  AppRole,
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  OvertimeRecord,
  AdvanceRequest,
  PuantajRecord,
  PuantajPeriodLock,
  AuditLog,
  NotificationItem,
  Customer,
  Site,
  Quote,
  Contract,
  JobReceipt,
  JobReceiptStatus,
  Invoice,
  InvoiceStatus,
  Collection,
  Payment,
  Membership,
  PayrollRun,
  PayrollItem,
  PayrollStatus,
  PayrollPayment,
  PersonnelDocument,
  PersonnelDocumentType,
  PersonnelType,
} from '../types';
import { getSupabase, isSupabaseConfigured, generateUuid } from './supabase';
import { hashTcIdentity } from './tcHash';

const GUEST_PROFILE: UserProfile = {
  id: 'guest', email: '', fullName: 'Giriş gerekli', role: 'personel', status: 'pasif', createdAt: new Date(0).toISOString(),
};

const EMPTY_PERSON: Person = {
  id: '', employeeNo: '', fullName: '', phone: '', kind: 'operator', status: 'pasif',
  poolStatus: 'musait', title: '', initials: '', documentsOk: false, certExpiring: false,
};

interface ERPContextType {
  // Auth & Roles
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userProfiles: UserProfile[];
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (email: string, pass: string, fullName: string, phone?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  uploadProfileAvatar: (file: File) => Promise<void>;

  // Personel
  personnel: Person[];
  addPerson: (person: Omit<Person, 'id'>) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string, soft?: boolean) => Promise<void>;
  exitPerson: (id: string, reason: string) => Promise<void>;
  personnelDocuments: PersonnelDocument[];
  uploadPersonnelDocument: (personnelId: string, type: PersonnelDocumentType, file: File, isSensitive?: boolean) => Promise<void>;
  personnelTypes: PersonnelType[];
  addPersonnelType: (name: string) => Promise<void>;

  // Üyelik & Eşleştirme
  memberships: Membership[];
  requestMembership: (tcNoOrHash: string, requestedRole: AppRole, personnelId?: string) => Promise<{ success: boolean; message: string }>;
  approveMembership: (id: string) => Promise<void>;
  rejectMembership: (id: string, reason: string) => Promise<void>;

  // Cari (Customers) & Şantiye (Sites)
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  sites: Site[];
  addSite: (site: Omit<Site, 'id' | 'createdAt'>) => Promise<void>;

  // Makbuz -> Fatura Hattı
  quotes: Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'quoteNo'>) => Promise<Quote>;
  contracts: Contract[];
  createContractFromQuote: (quoteId: string) => Promise<Contract>;
  jobReceipts: JobReceipt[];
  addJobReceipt: (receipt: Omit<JobReceipt, 'id' | 'createdAt' | 'receiptNo'>) => Promise<JobReceipt>;
  updateJobReceipt: (id: string, updates: Partial<JobReceipt>) => Promise<void>;
  approveJobReceipt: (id: string) => Promise<void>;
  rejectJobReceipt: (id: string, reason: string) => Promise<void>;
  invoices: Invoice[];
  createInvoiceFromReceipts: (receiptIds: string[], dueDate: string, notes?: string) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;

  // Tahsilat & Ödeme
  collections: Collection[];
  addCollection: (col: Omit<Collection, 'id' | 'createdAt'>) => Promise<void>;
  markCollectionReceived: (id: string) => Promise<void>;
  payments: Payment[];
  addPayment: (pay: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;

  // Maaş & Bordro
  payrollRuns: PayrollRun[];
  payrollItems: PayrollItem[];
  calculatePayroll: (month: string) => Promise<PayrollRun>;
  approvePayrollRun: (runId: string) => Promise<void>;
  payPayrollRun: (runId: string, paymentMethod?: 'banka' | 'nakit') => Promise<void>;
  payrollPayments: PayrollPayment[];
  addPayrollPayment: (payrollItemId: string, amount: number, paymentMethod?: 'banka' | 'nakit', note?: string) => Promise<void>;

  // Filo (Vinçler)
  cranes: Crane[];
  addCrane: (crane: Omit<Crane, 'id'>) => Promise<void>;
  updateCrane: (id: string, updates: Partial<Crane>) => Promise<void>;
  updateCraneStatus: (id: string, status: CraneStatus) => Promise<void>;
  deleteCrane: (id: string, soft?: boolean) => Promise<void>;

  // Onay Merkezi
  approvals: Approval[];
  addApproval: (approval: Omit<Approval, 'id' | 'createdAt'>) => Promise<void>;
  approveRequest: (id: string, note?: string) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;

  // Yoklama
  attendance: AttendanceRecord[];
  recordAttendance: (personId: string, status: AttendanceStatus, checkIn?: string, checkOut?: string, note?: string) => Promise<void>;

  // İzinler
  leaves: LeaveRequest[];
  createLeaveRequest: (personId: string, leaveType: LeaveRequest['leaveType'], startDate: string, endDate: string, days: number, description?: string) => Promise<void>;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;

  // Mesailer
  overtimes: OvertimeRecord[];
  createOvertimeRequest: (personId: string, date: string, startTime: string, endTime: string, hours: number, type: OvertimeRecord['overtimeType'], description?: string) => Promise<void>;
  updateOvertimeStatus: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;

  // Avanslar
  advances: AdvanceRequest[];
  createAdvanceRequest: (personId: string, amount: number, date: string, description?: string) => Promise<void>;
  updateAdvanceStatus: (id: string, status: 'approved' | 'rejected' | 'paid', reason?: string) => Promise<void>;

  // Puantaj
  puantajRecords: PuantajRecord[];
  periodLocks: Record<string, PuantajPeriodLock>;
  generateMonthlyPuantaj: (month: string) => Promise<void>;
  togglePeriodLock: (month: string, lock: boolean, notes?: string) => Promise<void>;
  updatePuantajRecord: (id: string, updates: Partial<PuantajRecord>) => Promise<void>;

  // Finans Eski & Masraflar
  receipts: Receipt[];
  addReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => Promise<void>;
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;

  // Denetim & Bildirimler
  auditLogs: AuditLog[];
  logAction: (action: string, module: string, recordId?: string, details?: string, oldData?: any, newData?: any) => Promise<void>;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  sendNotification: (title: string, message: string, type: NotificationItem['type'], userId?: string) => void;

  // Harita & Telemetri
  telemetry: TelemetryPoint[];

  // Global Metrikler
  stats: {
    totalPersonnel: number;
    activePersonnel: number;
    totalCranes: number;
    totalCranesCount: number;
    activeCranes: number;
    activeCranesCount: number;
    pendingApprovals: number;
    pendingApprovalsCount: number;
    totalRevenue: number;
    todayRevenue: number;
    totalExpense: number;
    todayExpenses: number;
    todayFuel: number;
    cutReceiptsCount: number;
    pendingReceiptsCount: number;
    unInvoicedReceiptsCount: number;
    unInvoicedReceiptsTotal: number;
    pendingCollectionsTotal: number;
    pendingPaymentsTotal: number;
    monthlyOvertimeHours: number;
  };

  currentOperator: Person;
  setCurrentOperatorId: (id: string) => void;

  // UI & DB Durumu
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isSyncing: boolean;
  dbConnected: boolean;
  isSupabaseOnline: boolean;
  dbError: string | null;
  retryDbConnection: () => Promise<void>;
  refreshFromDb: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | null>(null);

// LocalStorage Yardımcısı
function loadStored<T>(key: string, fallback: T): T {
  // Supabase is canonical; localStorage is write-through cache only and is never
  // trusted as an initial data source after a full page reload.
  void key;
  return fallback;
}

function saveStored<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed saving ${key}:`, e);
  }
}

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Kullanıcı & Auth
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(() =>
    loadStored('bv_user_profiles', [])
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_PROFILE);
  const [activeRole, setActiveRole] = useState<AppRole>(currentUser.role);

  // 2. Ana Veri Setleri
  const [personnel, setPersonnel] = useState<Person[]>(() =>
    loadStored('bv_personnel', [])
  );
  const [personnelDocuments, setPersonnelDocuments] = useState<PersonnelDocument[]>(() =>
    loadStored('bv_personnel_documents', [])
  );
  const [personnelTypes, setPersonnelTypes] = useState<PersonnelType[]>(() => loadStored('bv_personnel_types', []));
  const [payrollPayments, setPayrollPayments] = useState<PayrollPayment[]>(() => loadStored('bv_payroll_payments', []));
  const [cranes, setCranes] = useState<Crane[]>(() =>
    loadStored('bv_cranes', [])
  );
  const [approvals, setApprovals] = useState<Approval[]>(() =>
    loadStored('bv_approvals', [])
  );
  const [receipts, setReceipts] = useState<Receipt[]>(() =>
    loadStored('bv_receipts', [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadStored('bv_expenses', [])
  );

  // 2.1 Cari, Şantiye, Makbuz & Fatura Hattı
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStored('bv_customers', [])
  );
  const [sites, setSites] = useState<Site[]>(() =>
    loadStored('bv_sites', [])
  );
  const [quotes, setQuotes] = useState<Quote[]>(() => loadStored('bv_quotes', []));
  const [contracts, setContracts] = useState<Contract[]>(() => loadStored('bv_contracts', []));
  const [jobReceipts, setJobReceipts] = useState<JobReceipt[]>(() =>
    loadStored('bv_job_receipts', [])
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadStored('bv_invoices', [])
  );
  const [collections, setCollections] = useState<Collection[]>(() =>
    loadStored('bv_collections', [])
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    loadStored('bv_payments', [])
  );
  const [memberships, setMemberships] = useState<Membership[]>(() =>
    loadStored('bv_memberships', [])
  );
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() =>
    loadStored('bv_payroll_runs', [])
  );
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>(() =>
    loadStored('bv_payroll_items', [])
  );
  const [dbError, setDbError] = useState<string | null>(null);

  // 3. Puantaj, Yoklama, İzin, Mesai, Avans
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    loadStored('bv_attendance', [])
  );
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() =>
    loadStored('bv_leaves', [])
  );
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>(() =>
    loadStored('bv_overtimes', [])
  );
  const [advances, setAdvances] = useState<AdvanceRequest[]>(() =>
    loadStored('bv_advances', [])
  );
  const [puantajRecords, setPuantajRecords] = useState<PuantajRecord[]>(() =>
    loadStored('bv_puantaj', [])
  );
  const [periodLocks, setPeriodLocks] = useState<Record<string, PuantajPeriodLock>>(() =>
    loadStored('bv_period_locks', {})
  );

  // 4. Denetim & Bildirimler
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStored('bv_audit_logs', [])
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadStored('bv_notifications', [])
  );

  // UI Durumları
  const [currentOperatorId, setCurrentOperatorId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Denetim Kaydı Ekleme
  const logAction = useCallback(
    async (action: string, module: string, recordId?: string, details?: string, oldData?: any, newData?: any) => {
      const newLog: AuditLog = {
        id: generateUuid(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action,
        module,
        recordId,
        details,
        oldData,
        newData,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => {
        const updated = [newLog, ...prev.slice(0, 199)];
        saveStored('bv_audit_logs', updated);
        return updated;
      });

      // Supabase'e yaz
      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('audit_logs').insert([
            {
              id: newLog.id,
              user_id: newLog.userId,
              user_name: newLog.userName,
              user_role: newLog.userRole,
              action: newLog.action,
              module: newLog.module,
              record_id: newLog.recordId,
              details: newLog.details,
              old_data: newLog.oldData,
              new_data: newLog.newData,
            },
          ]);
        } catch (e) {
          console.warn('Audit log remote sync skipped:', e);
        }
      }
    },
    [currentUser]
  );

  // Bildirim Gönderme
  const sendNotification = useCallback(
    (title: string, message: string, type: NotificationItem['type'] = 'info', userId?: string) => {
      const item: NotificationItem = {
        id: generateUuid(),
        userId,
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => {
        const next = [item, ...prev];
        saveStored('bv_notifications', next);
        return next;
      });
      showToast(`🔔 ${title}: ${message}`);
    },
    [showToast]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveStored('bv_notifications', next);
      return next;
    });
    const sb = getSupabase();
    if (sb) await sb.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  // Supabase'den Verileri Tazele
  const refreshFromDb = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setDbConnected(false);
      return;
    }
    const sb = getSupabase();
    if (!sb) return;

    setIsSyncing(true);
    try {
      // 1. Personel
      const { data: pData, error: personnelError } = await sb.from('personnel').select('*');
      if (personnelError) throw personnelError;
      {
        const mapped: Person[] = (pData || []).map((d: any) => ({
          id: d.id,
          employeeNo: d.employee_no || 'OP-000',
          fullName: d.full_name,
          tcNo: d.tc_no,
          phone: d.phone,
          email: d.email,
          address: d.address,
          kind: d.kind,
          personnelTypeId: d.personnel_type_id,
          status: d.status,
          poolStatus: d.pool_status,
          department: d.department,
          salary: Number(d.salary) || 0,
          iban: d.iban,
          startDate: d.start_date,
          endDate: d.end_date,
          title: d.title || 'Operatör',
          initials: d.initials || d.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          cardSlug: d.card_slug,
          documentsOk: d.documents_ok ?? true,
          certExpiring: d.cert_expiring ?? false,
          notes: d.notes,
          userId: d.user_id,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setPersonnel(mapped);
        saveStored('bv_personnel', mapped);
      }

      const { data: documentData, error: documentError } = await sb.from('personnel_documents').select('id, personnel_id, document_type, file_name, storage_path, expires_at, is_sensitive, created_at');
      if (documentError) throw documentError;
      const mappedDocuments: PersonnelDocument[] = (documentData || []).map((d: any) => ({
        id: d.id,
        personnelId: d.personnel_id,
        documentType: d.document_type,
        fileName: d.file_name,
        storagePath: d.storage_path,
        expiresAt: d.expires_at,
        isSensitive: Boolean(d.is_sensitive),
        createdAt: d.created_at,
      }));
      setPersonnelDocuments(mappedDocuments);
      saveStored('bv_personnel_documents', mappedDocuments);

      const { data: typeData, error: typeError } = await sb.from('personnel_types').select('id, name, is_active').order('name');
      if (typeError) throw typeError;
      const mappedTypes: PersonnelType[] = (typeData || []).map((d: any) => ({ id: d.id, name: d.name, isActive: Boolean(d.is_active) }));
      setPersonnelTypes(mappedTypes);
      saveStored('bv_personnel_types', mappedTypes);

      const { data: payrollPaymentData, error: payrollPaymentError } = await sb.from('payroll_payments').select('id, payroll_item_id, payroll_run_id, personnel_id, amount, payment_method, payment_date, note, paid_by, created_at').order('created_at', { ascending: false });
      if (payrollPaymentError) throw payrollPaymentError;
      const mappedPayrollPayments: PayrollPayment[] = (payrollPaymentData || []).map((d: any) => ({ id: d.id, payrollItemId: d.payroll_item_id, payrollRunId: d.payroll_run_id, personnelId: d.personnel_id, amount: Number(d.amount), paymentMethod: d.payment_method, paymentDate: d.payment_date, note: d.note, paidBy: d.paid_by, createdAt: d.created_at }));
      setPayrollPayments(mappedPayrollPayments);
      saveStored('bv_payroll_payments', mappedPayrollPayments);

      // 2. Vinçler
      const { data: cData, error: cranesError } = await sb.from('cranes').select('*');
      if (cranesError) throw cranesError;
      {
        const mapped: Crane[] = (cData || []).map((d: any) => ({
          id: d.id,
          code: d.code,
          type: d.type || d.crane_type || '',
          status: d.status,
          capacity: d.capacity,
          operator: d.operator || d.operator_name,
          site: d.site || d.site_label,
          lastService: d.last_service || '2026-08-01',
          lat: d.lat || 41.01,
          lng: d.lng || 29.0,
          meterHours: Number(d.meter_hours) || 0,
          nextServiceHours: d.next_service_hours,
          nextServiceDate: d.next_service_date,
          telemetryProvider: d.telemetry_provider || 'manual',
          telemetryLastSeen: d.telemetry_last_seen,
          notes: d.notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setCranes(mapped);
        saveStored('bv_cranes', mapped);
      }

      // 3. Onaylar
      const { data: aData, error: approvalsError } = await sb.from('approvals').select('*').order('created_at', { ascending: false });
      if (approvalsError) throw approvalsError;
      {
        const mapped: Approval[] = (aData || []).map((d: any) => ({
          id: d.id,
          kind: d.kind,
          status: d.status,
          title: d.title,
          personId: d.person_id,
          personName: d.person_name,
          personInitials: d.person_initials,
          relatedLabel: d.related_label,
          amount: Number(d.amount) || 0,
          requestedDate: d.requested_date,
          startDate: d.start_date,
          endDate: d.end_date,
          hours: Number(d.hours) || 0,
          note: d.note,
          decisionNote: d.decision_note,
          approvedBy: d.approved_by,
          approvedAt: d.approved_at,
          rejectedBy: d.rejected_by,
          rejectedAt: d.rejected_at,
          rejectionReason: d.rejection_reason,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setApprovals(mapped);
        saveStored('bv_approvals', mapped);
      }

      const { data: notificationData, error: notificationError } = await sb.from('notifications').select('id,user_id,title,message,type,is_read,related_url,created_at').or(`user_id.is.null,user_id.eq.${currentUser.id}`).order('created_at', { ascending: false }).limit(100);
      if (notificationError) throw notificationError;
      const mappedNotifications: NotificationItem[] = (notificationData || []).map((d: any) => ({ id: d.id, userId: d.user_id, title: d.title, message: d.message, type: d.type, isRead: Boolean(d.is_read), relatedUrl: d.related_url, createdAt: d.created_at }));
      setNotifications(mappedNotifications); saveStored('bv_notifications', mappedNotifications);

      // 4. Makbuzlar
      const { data: rData, error: receiptsError } = await sb.from('receipts').select('*').order('created_at', { ascending: false });
      if (receiptsError) throw receiptsError;
      {
        const mapped: Receipt[] = (rData || []).map((d: any) => ({
          id: d.id,
          receiptNo: d.receipt_no,
          company: d.company,
          amount: Number(d.amount) || 0,
          status: d.status,
          craneCode: d.crane_code,
          site: d.site,
          daysPending: d.days_pending || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setReceipts(mapped);
        saveStored('bv_receipts', mapped);
      }

      // 5. Masraflar
      const { data: eData, error: expensesError } = await sb.from('expenses').select('*').order('created_at', { ascending: false });
      if (expensesError) throw expensesError;
      {
        const mapped: Expense[] = (eData || []).map((d: any) => ({
          id: d.id,
          category: d.category,
          title: d.title,
          detail: d.detail,
          amount: Number(d.amount) || 0,
          craneCode: d.crane_code,
          personName: d.person_name,
          stationOrSupplier: d.station_or_supplier,
          status: d.status,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setExpenses(mapped);
        saveStored('bv_expenses', mapped);
      }

      const { data: customerData, error: customersError } = await sb.from('customers').select('*').order('created_at', { ascending: false });
      if (customersError) throw customersError;
      const mappedCustomers: Customer[] = (customerData || []).map((d: any) => ({
        id: d.id, title: d.title, name: d.title, vknTckn: d.vkn_tckn, taxNo: d.vkn_tckn,
        authorizedPerson: d.authorized_person, contactName: d.authorized_person, phone: d.phone || '', email: d.email,
        address: d.address, taxOffice: d.tax_office, balance: Number(d.balance) || 0, notes: d.notes,
        createdAt: d.created_at, updatedAt: d.updated_at,
      }));
      setCustomers(mappedCustomers); saveStored('bv_customers', mappedCustomers);

      const { data: siteData, error: sitesError } = await sb.from('sites').select('*').order('created_at', { ascending: false });
      if (sitesError) throw sitesError;
      const mappedSites: Site[] = (siteData || []).map((d: any) => ({
        id: d.id, name: d.name, customerId: d.customer_id, customerName: d.customer_name, location: d.location,
        contactPerson: d.contact_person, contactPhone: d.phone, phone: d.phone, status: d.status, createdAt: d.created_at,
      }));
      setSites(mappedSites); saveStored('bv_sites', mappedSites);

      const { data: jobReceiptData, error: jobReceiptsError } = await sb.from('job_receipts').select('*').order('created_at', { ascending: false });
      if (jobReceiptsError) throw jobReceiptsError;
      const mappedJobReceipts: JobReceipt[] = (jobReceiptData || []).map((d: any) => ({
        id: d.id, receiptNo: d.receipt_no, customerId: d.customer_id, customerName: d.customer_name, siteId: d.site_id,
        siteName: d.site_name, craneCode: d.crane_code, operatorId: d.operator_id, operatorName: d.operator_name,
        date: d.date, startTime: d.start_time, endTime: d.end_time, workingHours: Number(d.working_hours) || 0,
        description: d.description, lines: d.lines || [], amount: Number(d.amount) || 0, status: d.status,
        invoiced: Boolean(d.invoiced), invoiceId: d.invoice_id, invoiceNo: d.invoice_no, approvedBy: d.approved_by,
        approvedAt: d.approved_at, rejectedBy: d.rejected_by, rejectedAt: d.rejected_at, rejectionReason: d.rejection_reason,
        note: d.note, createdAt: d.created_at, updatedAt: d.updated_at,
      }));
      setJobReceipts(mappedJobReceipts); saveStored('bv_job_receipts', mappedJobReceipts);

      const { data: invoiceData, error: invoicesError } = await sb.from('invoices').select('*').order('created_at', { ascending: false });
      if (invoicesError) throw invoicesError;
      const mappedInvoices: Invoice[] = (invoiceData || []).map((d: any) => ({
        id: d.id, invoiceNo: d.invoice_no, customerId: d.customer_id, customerName: d.customer_name,
        receiptIds: d.receipt_ids || [], issueDate: d.issue_date, dueDate: d.due_date, subtotal: Number(d.subtotal) || 0,
        taxRate: Number(d.tax_rate) || 20, taxAmount: Number(d.tax_amount) || 0, totalAmount: Number(d.total_amount) || 0,
        paidAmount: Number(d.paid_amount) || 0, status: d.status, notes: d.notes, createdAt: d.created_at, updatedAt: d.updated_at,
      }));
      setInvoices(mappedInvoices); saveStored('bv_invoices', mappedInvoices);

      const { data: collectionData, error: collectionsError } = await sb.from('collections').select('*').order('created_at', { ascending: false });
      if (collectionsError) throw collectionsError;
      const mappedCollections: Collection[] = (collectionData || []).map((d: any) => ({
        id: d.id, customerId: d.customer_id, customerName: d.customer_name, invoiceId: d.invoice_id, invoiceNo: d.invoice_no,
        amount: Number(d.amount) || 0, dueDate: d.due_date, date: d.date, paymentMethod: d.payment_method,
        status: d.status, notes: d.notes, createdAt: d.created_at,
      }));
      setCollections(mappedCollections); saveStored('bv_collections', mappedCollections);

      const { data: paymentData, error: paymentsError } = await sb.from('payments').select('*').order('created_at', { ascending: false });
      if (paymentsError) throw paymentsError;
      const mappedPayments: Payment[] = (paymentData || []).map((d: any) => ({
        id: d.id, recipientType: d.recipient_type, recipientId: d.recipient_id, recipientName: d.recipient_name,
        category: d.category, amount: Number(d.amount) || 0, dueDate: d.due_date, paidDate: d.paid_date,
        paymentDate: d.payment_date, paymentMethod: d.payment_method, status: d.status, payrollItemId: d.payroll_item_id,
        notes: d.notes, createdAt: d.created_at,
      }));
      setPayments(mappedPayments); saveStored('bv_payments', mappedPayments);

      setDbConnected(true);
    } catch (err) {
      console.error('Supabase fetch error:', err);
      setDbError(err instanceof Error ? err.message : 'Supabase verileri yüklenemedi.');
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser.id]);

  // Sayfa yüklendiğinde gerçek Supabase Auth oturumunu geri yükle; localStorage yalnızca cache'tir.
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('bv_remote_source_v1')) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('bv_'))
        .forEach((key) => localStorage.removeItem(key));
      localStorage.setItem('bv_remote_source_v1', '1');
      setUserProfiles([]);
      setIsAuthenticated(false);
      setCurrentUser(GUEST_PROFILE);
      setActiveRole(GUEST_PROFILE.role);
      setPersonnel([]);
      setCranes([]);
      setApprovals([]);
      setReceipts([]);
      setExpenses([]);
      setCustomers([]);
      setSites([]);
      setQuotes([]);
      setContracts([]);
      setJobReceipts([]);
      setInvoices([]);
      setCollections([]);
      setPayments([]);
      setMemberships([]);
    }
    const sb = getSupabase();
    if (!sb) { setIsAuthReady(true); return; }
    let cancelled = false;
    const restore = async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      const authUser = data.session?.user;
      if (!authUser) {
        setCurrentUser(GUEST_PROFILE); setIsAuthenticated(false); setActiveRole(GUEST_PROFILE.role); setIsAuthReady(true); return;
      }
      const { data: profileRow, error } = await sb.from('profiles').select('id,email,full_name,role,phone,status,personnel_id,avatar_url,created_at,updated_at').eq('id', authUser.id).maybeSingle();
      if (error || !profileRow || profileRow.status !== 'aktif') {
        await sb.auth.signOut(); setCurrentUser(GUEST_PROFILE); setIsAuthenticated(false); setIsAuthReady(true); return;
      }
      const profile: UserProfile = { id: profileRow.id, email: profileRow.email || authUser.email || '', fullName: profileRow.full_name || authUser.email?.split('@')[0] || 'Kullanıcı', role: profileRow.role as AppRole, phone: profileRow.phone || undefined, personnelId: profileRow.personnel_id || undefined, avatarUrl: profileRow.avatar_url || undefined, status: profileRow.status, createdAt: profileRow.created_at || authUser.created_at, updatedAt: profileRow.updated_at || undefined };
      setCurrentUser(profile); setIsAuthenticated(true); setActiveRole(profile.role); saveStored('bv_current_user', profile); await refreshFromDb(); setIsAuthReady(true);
    };
    void restore();
    const { data: authListener } = sb.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || !session) { setCurrentUser(GUEST_PROFILE); setIsAuthenticated(false); setActiveRole(GUEST_PROFILE.role); setIsAuthReady(true); } });
    return () => { cancelled = true; authListener.subscription.unsubscribe(); };
  }, [refreshFromDb]);

  // Auth & Kullanıcı Metotları
  const loginWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const sb = getSupabase();
    if (!sb) {
      return { success: false, message: 'Supabase bağlantısı yapılandırılmamış. Giriş şu anda kullanılamıyor.' };
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error || !data.user) {
      return { success: false, message: error?.message || 'Giriş başarısız.' };
    }
    const { data: profileRow, error: profileError } = await sb
      .from('profiles')
      .select('id,email,full_name,role,phone,status,personnel_id,avatar_url,created_at,updated_at')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profileError || !profileRow) {
      await sb.auth.signOut();
      return { success: false, message: 'Üyeliğiniz henüz kurucu tarafından onaylanmamış.' };
    }
    if (profileRow.status !== 'aktif') {
      await sb.auth.signOut();
      return { success: false, message: profileRow.status === 'pending' ? 'Üyeliğiniz onay bekliyor.' : 'Hesabınız pasif durumda.' };
    }
    const profile: UserProfile = {
      id: profileRow.id,
      email: profileRow.email || data.user.email || email,
      fullName: profileRow.full_name || email.split('@')[0],
      role: profileRow.role as AppRole,
      phone: profileRow.phone || undefined,
      personnelId: profileRow.personnel_id || undefined,
      avatarUrl: profileRow.avatar_url || undefined,
      status: profileRow.status as UserProfile['status'],
      createdAt: profileRow.created_at || data.user.created_at,
      updatedAt: profileRow.updated_at || undefined,
    };
    setCurrentUser(profile);
    setIsAuthenticated(true);
    setActiveRole(profile.role);
    saveStored('bv_current_user', profile);
    logAction('GİRİŞ_YAPILDI', 'Auth', data.user.id, 'Supabase Auth ile oturum açıldı.');
    return { success: true, message: `Hoş geldiniz, ${profile.fullName}!` };
  };

  const registerUser = async (email: string, pass: string, fullName: string, phone?: string): Promise<{ success: boolean; message: string }> => {
    const sb = getSupabase();
    if (!sb) {
      return { success: false, message: 'Supabase bağlantısı yapılandırılmamış. Üyelik başvurusu gönderilemiyor.' };
    }
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: fullName, phone } } });
    if (error || !data.user) {
      return { success: false, message: error?.message || 'Üyelik başvurusu oluşturulamadı.' };
    }
    if (data.session) await sb.auth.signOut();
    return { success: true, message: 'Başvurunuz alındı. Kurucu onayından sonra giriş yapabilirsiniz.' };
  };

  const logout = useCallback(() => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut().catch(() => {});
    }
    setCurrentUser(GUEST_PROFILE);
    setIsAuthenticated(false);
    setActiveRole(GUEST_PROFILE.role);
    localStorage.removeItem('bv_current_user');
    showToast('Oturum kapatıldı.');
  }, [showToast]);

  const updateUserProfile = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const payload: Record<string, unknown> = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.department !== undefined) payload.department = updates.department || null;
    if (updates.title !== undefined) payload.title = updates.title || null;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl || null;
    if (Object.keys(payload).length) {
      const { error } = await sb.from('profiles').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    }
    if (id === currentUser.id && updates.email && updates.email !== currentUser.email) {
      const { error } = await sb.auth.updateUser({ email: updates.email });
      if (error) throw error;
    }
    setUserProfiles((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u));
      saveStored('bv_user_profiles', next);
      return next;
    });
    if (currentUser.id === id) {
      setCurrentUser((prev) => {
        const next = { ...prev, ...updates };
        saveStored('bv_current_user', next);
        return next;
      });
    }
    showToast('Kullanıcı profili güncellendi.');
  }, [currentUser.id, currentUser.email, showToast]);

  const changePassword = useCallback(async (password: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    if (password.length < 8) throw new Error('Şifre en az 8 karakter olmalıdır.');
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
    showToast('✓ Şifreniz güncellendi.');
  }, [showToast]);

  const uploadProfileAvatar = useCallback(async (file: File) => {
    const sb = getSupabase();
    if (!sb || currentUser.id === 'guest') throw new Error('Aktif Supabase oturumu gerekli.');
    if (!file.type.startsWith('image/')) throw new Error('Yalnızca görsel dosyası yükleyebilirsiniz.');
    const path = `${currentUser.id}/avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const { error: uploadError } = await sb.storage.from('profile-avatars').upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    const avatarUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/profile-avatars/${path}`;
    await updateUserProfile(currentUser.id, { avatarUrl });
    showToast('✓ Profil fotoğrafı güncellendi.');
  }, [currentUser.id, showToast, updateUserProfile]);

  // Personel CRUD
  const addPerson = async (personData: Omit<Person, 'id'>) => {
    const id = generateUuid();
    const initials = personData.initials || personData.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const cardSlug = personData.cardSlug || personData.fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newPerson: Person = {
      ...personData,
      id,
      initials,
      cardSlug,
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Personel yalnızca remote veritabanına kaydedilebilir.');
    const { error: insertError } = await sb.from('personnel').insert([
          {
            id: newPerson.id,
            employee_no: newPerson.employeeNo,
            full_name: newPerson.fullName,
            tc_no: newPerson.tcNo,
            phone: newPerson.phone,
            email: newPerson.email,
            address: newPerson.address,
            kind: newPerson.kind,
            personnel_type_id: newPerson.personnelTypeId || null,
            status: newPerson.status,
            pool_status: newPerson.poolStatus,
            department: newPerson.department,
            salary: newPerson.salary,
            iban: newPerson.iban,
            start_date: newPerson.startDate,
            title: newPerson.title,
            initials: newPerson.initials,
            card_slug: newPerson.cardSlug,
            documents_ok: newPerson.documentsOk,
            cert_expiring: newPerson.certExpiring,
            notes: newPerson.notes,
            end_date: newPerson.endDate || null,
            user_id: newPerson.userId || null,
          },
        ]);
    if (insertError) {
      showToast(`Personel kaydedilemedi: ${insertError.message}`);
      throw insertError;
    }
    setPersonnel((prev) => {
      const next = [newPerson, ...prev];
      saveStored('bv_personnel', next);
      return next;
    });
    logAction('PERSONEL_EKLENDİ', 'Personel', id, `${newPerson.fullName} (${newPerson.employeeNo}) eklendi.`);
    showToast(`✓ Personel başarıyla eklendi: ${newPerson.fullName}`);
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Personel yalnızca remote veritabanında güncellenebilir.');
    const payload: any = { updated_at: new Date().toISOString() };
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.employeeNo) payload.employee_no = updates.employeeNo;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.email !== undefined) payload.email = updates.email || null;
        if (updates.address !== undefined) payload.address = updates.address || null;
        if (updates.kind) payload.kind = updates.kind;
        if (updates.personnelTypeId !== undefined) payload.personnel_type_id = updates.personnelTypeId || null;
        if (updates.status) payload.status = updates.status;
        if (updates.poolStatus !== undefined) payload.pool_status = updates.poolStatus;
        if (updates.salary !== undefined) payload.salary = updates.salary;
        if (updates.startDate !== undefined) payload.start_date = updates.startDate || null;
        if (updates.title) payload.title = updates.title;
        if (updates.endDate !== undefined) payload.end_date = updates.endDate || null;
        if (updates.iban !== undefined) payload.iban = updates.iban || null;
        if (updates.department !== undefined) payload.department = updates.department || null;
        if (updates.userId !== undefined) payload.user_id = updates.userId || null;
        if (updates.documentsOk !== undefined) payload.documents_ok = updates.documentsOk;
        if (updates.certExpiring !== undefined) payload.cert_expiring = updates.certExpiring;
        if (updates.notes !== undefined) payload.notes = updates.notes;
    const { error: updateError } = await sb.from('personnel').update(payload).eq('id', id);
    if (updateError) {
      showToast(`Personel güncellenemedi: ${updateError.message}`);
      throw updateError;
    }
    setPersonnel((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
      saveStored('bv_personnel', next);
      return next;
    });
    logAction('PERSONEL_GÜNCELLENDİ', 'Personel', id, `Personel kaydı güncellendi.`);
    showToast('✓ Personel bilgileri güncellendi.');
  };

  const uploadPersonnelDocument = async (personnelId: string, type: PersonnelDocumentType, file: File, isSensitive = false) => {
    const sb = getSupabase();
    if (!sb || !currentUser.id || currentUser.id === 'guest') throw new Error('Supabase bağlantısı veya oturum yok.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Belge boyutu en fazla 10 MB olabilir.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storagePath = `${personnelId}/${type}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await sb.storage.from('personnel-documents').upload(storagePath, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { data, error: insertError } = await sb.from('personnel_documents').insert({
      personnel_id: personnelId, document_type: type, file_name: file.name, storage_path: storagePath,
      is_sensitive: isSensitive, uploaded_by: currentUser.id,
    }).select('id, personnel_id, document_type, file_name, storage_path, expires_at, is_sensitive, created_at').single();
    if (insertError) throw insertError;
    const document: PersonnelDocument = { id: data.id, personnelId: data.personnel_id, documentType: data.document_type, fileName: data.file_name, storagePath: data.storage_path, expiresAt: data.expires_at, isSensitive: Boolean(data.is_sensitive), createdAt: data.created_at };
    setPersonnelDocuments((prev) => { const next = [document, ...prev]; saveStored('bv_personnel_documents', next); return next; });
    showToast(`✓ ${file.name} belgesi yüklendi.`);
  };

  const addPersonnelType = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const { data, error } = await sb.from('personnel_types').insert({ name: normalized, created_by: currentUser.id }).select('id, name, is_active').single();
    if (error) throw error;
    const type: PersonnelType = { id: data.id, name: data.name, isActive: Boolean(data.is_active) };
    setPersonnelTypes((prev) => { const next = [...prev, type].sort((a, b) => a.name.localeCompare(b.name, 'tr')); saveStored('bv_personnel_types', next); return next; });
    showToast(`✓ ${normalized} personel türü eklendi.`);
  };

  const deletePerson = async (id: string, soft = true) => {
    if (soft) {
      await updatePerson(id, { status: 'pasif', poolStatus: 'havuzda' });
      showToast('Personel pasife alındı (Arşivlendi).');
    } else {
      if (!['founder', 'admin'].includes(currentUser.role)) {
        showToast('Kalıcı silme yalnızca founder veya admin tarafından yapılabilir.');
        throw new Error('Hard delete requires founder or admin role');
      }
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase bağlantısı yok. Personel yalnızca remote veritabanından silinebilir.');
      const { error: deleteError } = await sb.from('personnel').delete().eq('id', id);
      if (deleteError) {
        showToast(`Personel silinemedi: ${deleteError.message}`);
        throw deleteError;
      }
      setPersonnel((prev) => {
        const next = prev.filter((p) => p.id !== id);
        saveStored('bv_personnel', next);
        return next;
      });
      logAction('PERSONEL_SİLİNDİ', 'Personel', id, 'Personel kalıcı olarak silindi.');
      showToast('Personel sistemden kaldırıldı.');

    }
  };

  const exitPerson = async (id: string, reason: string) => {
    if (!reason.trim()) throw new Error('İşten çıkış nedeni zorunludur.');
    const exitDate = new Date().toISOString().slice(0, 10);
    await updatePerson(id, { status: 'pasif', poolStatus: 'havuzda', endDate: exitDate, notes: reason.trim() });
    await logAction('PERSONEL_İŞTEN_ÇIKIŞ', 'Personel', id, `${exitDate}: ${reason.trim()}`);
    showToast('Personel işten çıkarıldı ve arşivlendi.');
  };

  // Vinç CRUD
  const addCrane = async (craneData: Omit<Crane, 'id'>) => {
    const id = generateUuid();
    const newCrane: Crane = {
      ...craneData,
      id,
      createdAt: new Date().toISOString(),
    };

    setCranes((prev) => {
      const next = [newCrane, ...prev];
      saveStored('bv_cranes', next);
      return next;
    });

    logAction('VİNÇ_EKLENDİ', 'Filo', id, `${newCrane.code} (${newCrane.type}) filoya dahil edildi.`);
    showToast(`✓ Yeni vinç eklendi: ${newCrane.code}`);

    const sb = getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('cranes').insert([
          {
            id: newCrane.id,
            code: newCrane.code,
            crane_type: newCrane.type,
            type: newCrane.type,
            status: newCrane.status,
            capacity: newCrane.capacity,
            operator: newCrane.operator,
            site_label: newCrane.site,
            site: newCrane.site,
            last_service: newCrane.lastService,
            lat: newCrane.lat,
            lng: newCrane.lng,
            notes: newCrane.notes,
          },
        ]);
        if (error) throw error;
      } catch (e) {
        console.error('Remote crane insert error:', e);
      }
    }
  };

  const updateCrane = async (id: string, updates: Partial<Crane>) => {
    setCranes((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
      saveStored('bv_cranes', next);
      return next;
    });

    logAction('VİNÇ_GÜNCELLENDİ', 'Filo', id, `Vinç kaydı güncellendi.`);
    showToast('✓ Vinç bilgileri güncellendi.');

    const sb = getSupabase();
    if (sb) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.status) payload.status = updates.status;
        if (updates.operator) payload.operator = updates.operator;
        if (updates.site) payload.site = updates.site;
        if (updates.lat) payload.lat = updates.lat;
        if (updates.lng) payload.lng = updates.lng;
        if (updates.type) { payload.type = updates.type; payload.crane_type = updates.type; }
        if (updates.site) payload.site_label = updates.site;
        const { error } = await sb.from('cranes').update(payload).eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('Remote crane update error:', e);
      }
    }
  };

  const deleteCrane = async (id: string, soft = true) => {
    if (soft) {
      await updateCrane(id, { status: 'pasif' });
      showToast('Vinç pasife alındı.');
    } else {
      setCranes((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveStored('bv_cranes', next);
        return next;
      });
      logAction('VİNÇ_SİLİNDİ', 'Filo', id, 'Vinç filodan kalıcı silindi.');
      showToast('Vinç filodan kaldırıldı.');

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('cranes').delete().eq('id', id);
        } catch (e) {
          console.error('Remote crane delete error:', e);
        }
      }
    }
  };

  // Onay Merkezi
  const addApproval = async (data: Omit<Approval, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newApproval: Approval = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    setApprovals((prev) => {
      const next = [newApproval, ...prev];
      saveStored('bv_approvals', next);
      return next;
    });

    logAction('ONAY_TALEBİ_OLUŞTURULDU', 'Onay', id, `${newApproval.personName} - ${newApproval.title}`);
    sendNotification('Yeni Onay Talebi', `${newApproval.personName}: ${newApproval.title}`, 'info');

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('approvals').insert([
          {
            id: newApproval.id,
            kind: newApproval.kind,
            status: newApproval.status,
            title: newApproval.title,
            person_id: newApproval.personId,
            person_name: newApproval.personName,
            person_initials: newApproval.personInitials,
            related_label: newApproval.relatedLabel,
            amount: newApproval.amount,
            requested_date: newApproval.requestedDate,
            start_date: newApproval.startDate,
            end_date: newApproval.endDate,
            hours: newApproval.hours,
            note: newApproval.note,
          },
        ]);
      } catch (e) {
        console.error('Remote approval insert error:', e);
      }
    }
  };

  const approveRequest = async (id: string, note?: string) => {
    const target = approvals.find((a) => a.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const approverName = currentUser.fullName;

    setApprovals((prev) => {
      const next = prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'approved' as const,
              decisionNote: note,
              approvedBy: approverName,
              approvedAt: now,
              updatedAt: now,
            }
          : a
      );
      saveStored('bv_approvals', next);
      return next;
    });

    logAction('TALEP_ONAYLANDI', 'Onay', id, `${approverName} tarafından '${target.title}' onaylandı.`);
    sendNotification('Talep Onaylandı', `'${target.title}' talebi onaylandı.`, 'success', target.personId);
    showToast(`✓ '${target.title}' talebi onaylandı.`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from('approvals')
          .update({
            status: 'approved',
            decision_note: note,
            approved_by: approverName,
            approved_at: now,
            updated_at: now,
          })
          .eq('id', id);
      } catch (e) {
        console.error('Remote approve error:', e);
      }
    }

    if (target.kind === 'yoklama' && target.personId && target.requestedDate && sb) {
      const parsed = target.relatedLabel ? JSON.parse(target.relatedLabel) as { checkInTime?: string; checkOut?: string; note?: string } : {};
      const requestedStatus = target.title.split(': ').pop()?.toLowerCase() as AttendanceStatus;
      const attendanceRecord: AttendanceRecord = {
        id: generateUuid(), personId: target.personId, personName: target.personName, date: target.requestedDate,
        checkInTime: parsed.checkInTime, checkOutTime: parsed.checkOut, status: ['geldi', 'gelmedi', 'izinli', 'raporlu', 'tatil', 'eksik'].includes(requestedStatus) ? requestedStatus : 'geldi',
        note: parsed.note, createdAt: now,
      };
      const { error: attendanceError } = await sb!.from('attendance_records').upsert({
        id: attendanceRecord.id, person_id: attendanceRecord.personId, person_name: attendanceRecord.personName,
        date: attendanceRecord.date, check_in_time: attendanceRecord.checkInTime, check_out_time: attendanceRecord.checkOutTime,
        status: attendanceRecord.status, note: attendanceRecord.note, updated_at: now,
      }, { onConflict: 'person_id,date' });
      if (attendanceError) throw attendanceError;
      setAttendance((prev) => {
        const next = [attendanceRecord, ...prev.filter((a) => !(a.personId === attendanceRecord.personId && a.date === attendanceRecord.date))];
        saveStored('bv_attendance', next);
        return next;
      });
      logAction('YOKLAMA_KAYDI', 'Puantaj', attendanceRecord.personId, `${approverName} onayıyla ${attendanceRecord.personName} yoklaması işlendi.`);
    }
    if (target.kind === 'makbuz_onay' && target.relatedLabel && sb) {
      await sb.from('job_receipts').update({ status: 'approved', approved_by: approverName, approved_at: now, updated_at: now }).eq('id', target.relatedLabel);
      setJobReceipts((prev) => prev.map((r) => r.id === target.relatedLabel ? { ...r, status: 'approved', approvedBy: approverName, approvedAt: now, updatedAt: now } : r));
    }
  };

  const rejectRequest = async (id: string, reason: string) => {
    const target = approvals.find((a) => a.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const rejectorName = currentUser.fullName;

    setApprovals((prev) => {
      const next = prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'rejected' as const,
              rejectionReason: reason,
              rejectedBy: rejectorName,
              rejectedAt: now,
              updatedAt: now,
            }
          : a
      );
      saveStored('bv_approvals', next);
      return next;
    });

    logAction('TALEP_REDDEDİLDİ', 'Onay', id, `${rejectorName} tarafından reddedildi. Sebep: ${reason}`);
    sendNotification('Talep Reddedildi', `'${target.title}' reddedildi. Sebep: ${reason}`, 'error', target.personId);
    showToast(`✕ '${target.title}' talebi reddedildi.`);
    if (target.kind === 'makbuz_onay' && target.relatedLabel) {
      setJobReceipts((prev) => prev.map((r) => r.id === target.relatedLabel ? { ...r, status: 'rejected', rejectionReason: reason, updatedAt: now } : r));
    }

    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from('approvals')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            rejected_by: rejectorName,
            rejected_at: now,
            updated_at: now,
          })
          .eq('id', id);
      } catch (e) {
        console.error('Remote reject error:', e);
      }
    }
    if (target.kind === 'makbuz_onay' && target.relatedLabel && sb) {
      await sb.from('job_receipts').update({ status: 'rejected', rejection_reason: reason, updated_at: now }).eq('id', target.relatedLabel);
    }
  };

  // Yoklama İşlemleri
  const recordAttendance = async (
    personId: string,
    status: AttendanceStatus,
    checkIn?: string,
    checkOut?: string,
    note?: string
  ) => {
    const person = personnel.find((p) => p.id === personId);
    const personName = person ? person.fullName : 'Bilinmeyen';
    const date = new Date().toISOString().split('T')[0];

    const checkInTime = checkIn || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    await addApproval({
      kind: 'yoklama',
      status: 'pending',
      title: `Günlük Yoklama: ${status.toUpperCase()}`,
      personId,
      personName,
      requestedDate: date,
      relatedLabel: JSON.stringify({ checkInTime, checkOut, note }),
      note: note || `Giriş: ${checkInTime}`,
    });
    showToast(`✓ ${personName} yoklaması yönetici onayına gönderildi.`);
  };

  // İzin Talebi
  const createLeaveRequest = async (
    personId: string,
    leaveType: LeaveRequest['leaveType'],
    startDate: string,
    endDate: string,
    days: number,
    description?: string
  ) => {
    const person = personnel.find((p) => p.id === personId);
    const personName = person ? person.fullName : 'Operatör';
    const id = generateUuid();

    const newLeave: LeaveRequest = {
      id,
      personId,
      personName,
      leaveType,
      startDate,
      endDate,
      days,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setLeaves((prev) => {
      const next = [newLeave, ...prev];
      saveStored('bv_leaves', next);
      return next;
    });

    await addApproval({
      kind: 'izin',
      status: 'pending',
      title: `${leaveType.toUpperCase()} İzni Talebi (${days} Gün)`,
      personId,
      personName,
      startDate,
      endDate,
      note: description,
    });

    showToast('✓ İzin talebiniz yönetici onayına gönderildi.');
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setLeaves((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, status, rejectionReason: reason, updatedAt: new Date().toISOString() } : l));
      saveStored('bv_leaves', next);
      return next;
    });
  };

  // Mesai Talebi
  const createOvertimeRequest = async (
    personId: string,
    date: string,
    startTime: string,
    endTime: string,
    hours: number,
    type: OvertimeRecord['overtimeType'],
    description?: string
  ) => {
    const person = personnel.find((p) => p.id === personId);
    const personName = person ? person.fullName : 'Operatör';
    const id = generateUuid();

    const newOvertime: OvertimeRecord = {
      id,
      personId,
      personName,
      date,
      startTime,
      endTime,
      totalHours: hours,
      overtimeType: type,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Mesai remote kaydedilemedi.');
    const { error: overtimeError } = await sb.from('overtimes').insert({
      id, person_id: personId, person_name: personName, date, start_time: startTime, end_time: endTime,
      total_hours: hours, overtime_type: type, description, status: 'pending',
    });
    if (overtimeError) throw overtimeError;

    setOvertimes((prev) => {
      const next = [newOvertime, ...prev];
      saveStored('bv_overtimes', next);
      return next;
    });

    await addApproval({
      kind: 'mesai',
      status: 'pending',
      title: `Fazla Mesai Talebi (${hours} Saat)`,
      personId,
      personName,
      hours,
      requestedDate: date,
      note: `${startTime} - ${endTime} | ${description || ''}`,
    });

    showToast('✓ Fazla mesai bildiriminiz onaya sunuldu.');
  };

  const updateOvertimeStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setOvertimes((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, status, rejectionReason: reason, updatedAt: new Date().toISOString() } : o));
      saveStored('bv_overtimes', next);
      return next;
    });
  };

  // Avans Talebi
  const createAdvanceRequest = async (personId: string, amount: number, date: string, description?: string) => {
    const person = personnel.find((p) => p.id === personId);
    const personName = person ? person.fullName : 'Operatör';
    const id = generateUuid();

    const newAdvance: AdvanceRequest = {
      id,
      personId,
      personName,
      amount,
      requestDate: date,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setAdvances((prev) => {
      const next = [newAdvance, ...prev];
      saveStored('bv_advances', next);
      return next;
    });

    await addApproval({
      kind: 'avans',
      status: 'pending',
      title: `Avans Talebi: ₺${amount.toLocaleString('tr-TR')}`,
      personId,
      personName,
      amount,
      requestedDate: date,
      note: description,
    });

    showToast(`✓ ₺${amount.toLocaleString('tr-TR')} tutarındaki avans talebi onay merkezine iletildi.`);
  };

  const updateAdvanceStatus = async (id: string, status: 'approved' | 'rejected' | 'paid', reason?: string) => {
    setAdvances((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status, rejectionReason: reason, updatedAt: new Date().toISOString() } : a));
      saveStored('bv_advances', next);
      return next;
    });
  };

  // Otomatik Puantaj Hesaplama Motoru
  const generateMonthlyPuantaj = async (month: string) => {
    // Puantaj kilitli mi kontrol et
    if (periodLocks[month]?.isLocked) {
      showToast(`✕ ${month} dönemi kilitlidir! Değişiklik yapmak için önce kilidi açınız.`);
      return;
    }

    const calculated: PuantajRecord[] = personnel
      .filter((p) => p.status === 'aktif')
      .map((p) => {
        // İlgili aya ait yoklama kayıtları
        const personAttendance = attendance.filter((a) => a.personId === p.id && a.date.startsWith(month));
        const workDays = personAttendance.filter((a) => a.status === 'geldi').length || 22; // varsayılan ay içi iş günü
        const sickDays = personAttendance.filter((a) => a.status === 'raporlu').length;
        const missingDays = personAttendance.filter((a) => a.status === 'gelmedi').length;

        // Onaylı izinler
        const approvedLeaveDays = leaves
          .filter((l) => l.personId === p.id && l.status === 'approved' && l.startDate.startsWith(month))
          .reduce((sum, l) => sum + l.days, 0);

        // Onaylı mesailer
        const approvedOvertimeHours = overtimes
          .filter((o) => o.personId === p.id && o.status === 'approved' && o.date.startsWith(month))
          .reduce((sum, o) => sum + o.totalHours, 0);

        const normalHours = workDays * 8;

        return {
          id: `${month}-${p.id}`,
          month,
          personId: p.id,
          personName: p.fullName,
          title: p.title,
          workDays,
          normalHours,
          overtimeHours: approvedOvertimeHours,
          leaveDays: approvedLeaveDays,
          sickDays,
          missingDays,
          isLocked: false,
          createdAt: new Date().toISOString(),
        };
      });

    setPuantajRecords((prev) => {
      const otherMonths = prev.filter((r) => r.month !== month);
      const next = [...calculated, ...otherMonths];
      saveStored('bv_puantaj', next);
      return next;
    });

    logAction('PUANTAJ_HESAPLANDI', 'Puantaj', month, `${month} dönemi otomatik puantajı başarıyla derlendi.`);
    showToast(`✓ ${month} ayı puantajı otomatik olarak derlendi (${calculated.length} personel).`);
  };

  const togglePeriodLock = async (month: string, lock: boolean, notes?: string) => {
    if (activeRole !== 'admin' && activeRole !== 'muhasebe') {
      showToast('✕ Bu işlem için YÖNETİCİ veya MUHASEBE yetkisi gereklidir!');
      return;
    }

    const lockObj: PuantajPeriodLock = {
      period: month,
      isLocked: lock,
      lockedBy: currentUser.fullName,
      lockedAt: new Date().toISOString(),
      notes,
    };

    setPeriodLocks((prev) => {
      const next = { ...prev, [month]: lockObj };
      saveStored('bv_period_locks', next);
      return next;
    });

    // İlgili kayıtları da kilitle
    setPuantajRecords((prev) => {
      const next = prev.map((r) => (r.month === month ? { ...r, isLocked: lock, lockedBy: currentUser.fullName } : r));
      saveStored('bv_puantaj', next);
      return next;
    });

    logAction(
      lock ? 'PUANTAJ_KİLİTLENDİ' : 'PUANTAJ_KİLİT_AÇILDI',
      'Puantaj',
      month,
      `${month} dönemi ${currentUser.fullName} tarafından ${lock ? 'kilitlendi' : 'tekrar açıldı'}. Not: ${notes || '-'}`
    );
    showToast(`✓ ${month} puantaj dönemi ${lock ? 'KİLİTLENDİ' : 'KİLİT KALDIRILDI'}.`);
  };

  const updatePuantajRecord = async (id: string, updates: Partial<PuantajRecord>) => {
    setPuantajRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
      saveStored('bv_puantaj', next);
      return next;
    });
    showToast('Puantaj satırı güncellendi.');
  };

  // Finans CRUD
  const addReceipt = async (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newReceipt: Receipt = {
      ...receiptData,
      id,
      createdAt: new Date().toISOString(),
    };

    setReceipts((prev) => {
      const next = [newReceipt, ...prev];
      saveStored('bv_receipts', next);
      return next;
    });

    logAction('MAKBUZ_KESİLDİ', 'Finans', id, `${newReceipt.receiptNo} - ${newReceipt.company} (₺${newReceipt.amount})`);
    showToast(`✓ Makbuz oluşturuldu: ${newReceipt.receiptNo}`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('receipts').insert([
          {
            id: newReceipt.id,
            receipt_no: newReceipt.receiptNo,
            company: newReceipt.company,
            amount: newReceipt.amount,
            status: newReceipt.status,
            crane_code: newReceipt.craneCode,
            site: newReceipt.site,
            days_pending: newReceipt.daysPending || 0,
          },
        ]);
      } catch (e) {
        console.error('Remote receipt error:', e);
      }
    }
  };

  const updateReceipt = async (id: string, updates: Partial<Receipt>) => {
    setReceipts((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
      saveStored('bv_receipts', next);
      return next;
    });
    showToast('Makbuz güncellendi.');
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newExpense: Expense = {
      ...expenseData,
      id,
      status: 'aktif',
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => {
      const next = [newExpense, ...prev];
      saveStored('bv_expenses', next);
      return next;
    });

    logAction('GİDER_KAYDEDİLDİ', 'Finans', id, `${newExpense.title} (₺${newExpense.amount})`);
    showToast(`✓ Masraf fişi kaydedildi: ₺${newExpense.amount.toLocaleString('tr-TR')}`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('expenses').insert([
          {
            id: newExpense.id,
            category: newExpense.category,
            title: newExpense.title,
            detail: newExpense.detail,
            amount: newExpense.amount,
            crane_code: newExpense.craneCode,
            person_name: newExpense.personName,
            station_or_supplier: newExpense.stationOrSupplier,
            status: newExpense.status,
          },
        ]);
      } catch (e) {
        console.error('Remote expense error:', e);
      }
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
      saveStored('bv_expenses', next);
      return next;
    });
    showToast('Gider kaydı güncellendi.');
  };

  // ==========================================
  // CARI (MÜŞTERİ) & ŞANTİYE YÖNETİMİ
  // ==========================================
  const addCustomer = async (custData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const id = generateUuid();
    const newCust: Customer = {
      ...custData,
      id,
      balance: custData.balance || 0,
      createdAt: new Date().toISOString(),
    };
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Cari yalnızca remote veritabanına kaydedilebilir.');
    const { error } = await sb.from('customers').insert([{
      id: newCust.id,
      title: newCust.title,
      vkn_tckn: newCust.vknTckn,
      tax_office: newCust.taxOffice,
      authorized_person: newCust.authorizedPerson,
      phone: newCust.phone,
      email: newCust.email,
      address: newCust.address,
      balance: newCust.balance,
      notes: newCust.notes,
    }]);
    if (error) throw error;
    setCustomers((prev) => { const next = [newCust, ...prev]; saveStored('bv_customers', next); return next; });
    logAction('CARI_EKLENDI', 'Cari', id, `${newCust.title} carisi sisteme eklendi.`);
    showToast(`✓ Cari Kart Oluşturuldu: ${newCust.title}`);
    return newCust;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Cari yalnızca remote veritabanında güncellenebilir.');
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.vknTckn !== undefined) payload.vkn_tckn = updates.vknTckn || null;
    if (updates.taxOffice !== undefined) payload.tax_office = updates.taxOffice || null;
    if (updates.authorizedPerson !== undefined) payload.authorized_person = updates.authorizedPerson || null;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email || null;
    if (updates.address !== undefined) payload.address = updates.address || null;
    if (updates.balance !== undefined) payload.balance = updates.balance;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;
    const { error } = await sb.from('customers').update(payload).eq('id', id);
    if (error) throw error;
    setCustomers((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
      saveStored('bv_customers', next);
      return next;
    });
    showToast('Cari bilgileri güncellendi.');
  };

  const deleteCustomer = async (id: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Cari yalnızca remote veritabanından silinebilir.');
    const { error } = await sb.from('customers').delete().eq('id', id);
    if (error) throw error;
    setCustomers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveStored('bv_customers', next);
      return next;
    });
    showToast('Cari silindi.');
  };

  const addSite = async (siteData: Omit<Site, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newSite: Site = {
      ...siteData,
      id,
      createdAt: new Date().toISOString(),
    };
    setSites((prev) => {
      const next = [newSite, ...prev];
      saveStored('bv_sites', next);
      return next;
    });
    showToast(`✓ Şantiye Tanımlandı: ${newSite.name}`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('sites').insert([
          {
            id: newSite.id,
            customer_id: newSite.customerId,
            name: newSite.name,
            location: newSite.location,
            contact_person: newSite.contactPerson,
            phone: newSite.phone,
            status: newSite.status,
          },
        ]);
      } catch (err: any) {
        console.warn('Supabase site insert notice:', err.message);
      }
    }
  };

  const addQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'quoteNo'>): Promise<Quote> => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Teklif numarası güvenli şekilde üretilemedi.');
    const { data: quoteNo, error: sequenceError } = await sb.rpc('next_document_number', { p_key: 'quote' });
    if (sequenceError || !quoteNo) throw sequenceError || new Error('Teklif numarası üretilemedi.');
    const quote: Quote = { ...quoteData, id: generateUuid(), quoteNo, createdAt: new Date().toISOString() };
    const { error } = await sb.from('quotes').insert({
      id: quote.id, quote_no: quote.quoteNo, customer_id: quote.customerId, customer_name: quote.customerName,
      site_name: quote.siteName, crane_code: quote.craneCode, lines: quote.lines, subtotal: quote.subtotal,
      tax_rate: quote.taxRate, tax_amount: quote.taxAmount, total_amount: quote.totalAmount, status: quote.status,
      valid_until: quote.validUntil, notes: quote.notes, created_by: currentUser.id,
    });
    if (error) throw error;
    setQuotes((prev) => { const next = [quote, ...prev]; saveStored('bv_quotes', next); return next; });
    logAction('TEKLIF_OLUSTURULDU', 'Teklif', quote.id, `${quote.quoteNo} - ${quote.customerName}`);
    showToast(`✓ Teklif oluşturuldu: ${quote.quoteNo}`);
    return quote;
  };

  const createContractFromQuote = async (quoteId: string): Promise<Contract> => {
    const quote = quotes.find((item) => item.id === quoteId);
    if (!quote) throw new Error('Sözleşmeye dönüştürülecek teklif bulunamadı.');
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Sözleşme numarası üretilemedi.');
    const { data: contractNo, error: sequenceError } = await sb.rpc('next_document_number', { p_key: 'contract' });
    if (sequenceError || !contractNo) throw sequenceError || new Error('Sözleşme numarası üretilemedi.');
    const contract: Contract = { id: generateUuid(), contractNo, quoteId, customerId: quote.customerId, customerName: quote.customerName, siteName: quote.siteName, status: 'draft', createdAt: new Date().toISOString() };
    const { error } = await sb.from('contracts').insert({ id: contract.id, contract_no: contract.contractNo, quote_id: quote.id, customer_id: contract.customerId, customer_name: contract.customerName, site_name: contract.siteName, status: contract.status, created_by: currentUser.id });
    if (error) throw error;
    setContracts((prev) => { const next = [contract, ...prev]; saveStored('bv_contracts', next); return next; });
    showToast(`✓ Sözleşme oluşturuldu: ${contract.contractNo}`);
    return contract;
  };

  // ==========================================
  // MAKBUZ (İŞ MAKBUZLARI) -> FATURA HATTI
  // ==========================================
  const addJobReceipt = async (receiptData: Omit<JobReceipt, 'id' | 'createdAt' | 'receiptNo'>): Promise<JobReceipt> => {
    const id = generateUuid();
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Makbuz numarası güvenli şekilde üretilemedi.');
    const { data: receiptNo, error: sequenceError } = await sb.rpc('next_document_number', { p_key: 'receipt' });
    if (sequenceError || !receiptNo) throw sequenceError || new Error('Makbuz numarası üretilemedi.');

    const newRec: JobReceipt = {
      ...receiptData,
      amount: 0,
      hourlyRate: undefined,
      id,
      receiptNo,
      status: 'pending_approval',
      invoiced: false,
      createdAt: new Date().toISOString(),
    };

    try {
        const { error: insertError } = await sb.from('job_receipts').insert([
          {
            id: newRec.id,
            receipt_no: newRec.receiptNo,
            customer_id: newRec.customerId,
            customer_name: newRec.customerName,
            site_id: newRec.siteId,
            site_name: newRec.siteName,
            crane_code: newRec.craneCode,
            operator_id: newRec.operatorId,
            operator_name: newRec.operatorName,
            date: newRec.date,
            start_time: newRec.startTime,
            end_time: newRec.endTime,
            working_hours: newRec.workingHours,
            description: newRec.description,
            amount: 0,
            status: newRec.status,
            invoiced: false,
          },
        ]);
        if (insertError) throw insertError;
      } catch (err: any) {
        throw new Error(`Makbuz remote kaydı başarısız: ${err.message}`);
      }

    setJobReceipts((prev) => { const next = [newRec, ...prev]; saveStored('bv_job_receipts', next); return next; });
    await addApproval({
      kind: 'makbuz_onay', status: 'pending', title: `İş Makbuzu Onayı: ${receiptNo} (${newRec.customerName})`,
      personId: newRec.operatorId, personName: newRec.operatorName, amount: 0, relatedLabel: newRec.id,
      note: `${newRec.workingHours || 0} Saat | ${newRec.craneCode} | ${newRec.description || ''}`, requestedDate: newRec.date,
    });
    logAction('MAKBUZ_OLUSTURULDU', 'Makbuz', id, `${receiptNo} no'lu makbuz oluşturuldu.`);
    showToast(`✓ İş makbuzu oluşturuldu (${receiptNo}) - Yönetici Onayına Sunuldu`);

    return newRec;
  };

  const updateJobReceipt = async (id: string, updates: Partial<JobReceipt>) => {
    setJobReceipts((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
      saveStored('bv_job_receipts', next);
      return next;
    });
  };

  const approveJobReceipt = async (id: string) => {
    const rec = jobReceipts.find((r) => r.id === id);
    if (!rec) return;

    setJobReceipts((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved' as JobReceiptStatus,
              approvedBy: currentUser.fullName,
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      saveStored('bv_job_receipts', next);
      return next;
    });

    logAction('MAKBUZ_ONAYLANDI', 'Makbuz', id, `${rec.receiptNo} makbuzu onaylandı, faturalandırmaya hazır.`);
    showToast(`✓ Makbuz Onaylandı (${rec.receiptNo})`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from('job_receipts')
          .update({
            status: 'approved',
            approved_by: currentUser.fullName,
            approved_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase approve job receipt sync error:', e);
      }
    }
  };

  const rejectJobReceipt = async (id: string, reason: string) => {
    setJobReceipts((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected' as JobReceiptStatus,
              rejectedBy: currentUser.fullName,
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason,
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      saveStored('bv_job_receipts', next);
      return next;
    });
    showToast('Makbuz reddedildi.');
  };

  // Faturalandırma Motoru (Makbuz -> Fatura Dönüşümü)
  const createInvoiceFromReceipts = async (
    receiptIds: string[],
    dueDate: string,
    notes?: string
  ): Promise<Invoice> => {
    const selectedReceipts = jobReceipts.filter((r) => receiptIds.includes(r.id));
    if (selectedReceipts.length === 0) {
      throw new Error('Faturalandırılacak makbuz bulunamadı.');
    }

    const firstCustomer = selectedReceipts[0];
    const customerId = firstCustomer.customerId;
    const customerName = firstCustomer.customerName;

    const subtotal = selectedReceipts.reduce((sum, r) => sum + r.amount, 0);
    const taxRate = 20;
    const taxAmount = Math.round(subtotal * 0.2);
    const totalAmount = subtotal + taxAmount;

    const invoiceId = generateUuid();
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Fatura numarası güvenli şekilde üretilemedi.');
    const { data: invoiceNo, error: sequenceError } = await sb.rpc('next_document_number', { p_key: 'invoice' });
    if (sequenceError || !invoiceNo) throw sequenceError || new Error('Fatura numarası üretilemedi.');

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNo,
      customerId,
      customerName,
      receiptIds,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      status: 'issued',
      notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Faturaları Güncelle
    setInvoices((prev) => {
      const next = [newInvoice, ...prev];
      saveStored('bv_invoices', next);
      return next;
    });

    // 2. İlgili Makbuzları Güncelle (Artık Faturalandı)
    setJobReceipts((prev) => {
      const next = prev.map((r) =>
        receiptIds.includes(r.id)
          ? {
              ...r,
              invoiced: true,
              invoiceId,
              invoiceNo,
              status: 'invoiced' as JobReceiptStatus,
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      saveStored('bv_job_receipts', next);
      return next;
    });

    // 3. Cari Bakiyesini Güncelle (Müşteri Borçlandı)
    setCustomers((prev) => {
      const next = prev.map((c) =>
        c.id === customerId
          ? { ...c, balance: (c.balance || 0) + totalAmount, updatedAt: new Date().toISOString() }
          : c
      );
      saveStored('bv_customers', next);
      return next;
    });

    // 4. Otomatik Tahsilat Kaydı Aç (Bekliyor Durumunda)
    const collectionId = generateUuid();
    const newCollection: Collection = {
      id: collectionId,
      customerId,
      customerName,
      invoiceId,
      invoiceNo,
      amount: totalAmount,
      dueDate,
      date: dueDate,
      paymentMethod: 'havale',
      status: 'bekliyor',
      notes: `${invoiceNo} nolu faturanın tahsilatı`,
      createdAt: new Date().toISOString(),
    };
    setCollections((prev) => {
      const next = [newCollection, ...prev];
      saveStored('bv_collections', next);
      return next;
    });

    logAction('FATURA_KESILDI', 'Fatura', invoiceId, `${invoiceNo} nolu ${totalAmount.toLocaleString('tr-TR')} ₺ fatura düzenlendi.`);
    showToast(`✓ Fatura Kesildi: ${invoiceNo} (Toplam: ₺${totalAmount.toLocaleString('tr-TR')})`);

    try {
        const { error: invoiceError } = await sb.from('invoices').insert([
          {
            id: newInvoice.id,
            invoice_no: newInvoice.invoiceNo,
            customer_id: newInvoice.customerId,
            receipt_ids: newInvoice.receiptIds,
            issue_date: newInvoice.issueDate,
            due_date: newInvoice.dueDate,
            subtotal: newInvoice.subtotal,
            tax_rate: newInvoice.taxRate,
            tax_amount: newInvoice.taxAmount,
            total_amount: newInvoice.totalAmount,
            paid_amount: 0,
            status: 'issued',
            notes: newInvoice.notes,
          },
        ]);
        if (invoiceError) throw invoiceError;
      } catch (err: any) {
        throw new Error(`Fatura remote kaydı başarısız: ${err.message}`);
      }

    return newInvoice;
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    setInvoices((prev) => {
      const next = prev.map((inv) => (inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv));
      saveStored('bv_invoices', next);
      return next;
    });
    showToast('Fatura durumu güncellendi.');
  };

  // ==========================================
  // TAHSİLAT & ÖDEME YÖNETİMİ
  // ==========================================
  const addCollection = async (colData: Omit<Collection, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newCol: Collection = {
      ...colData,
      id,
      createdAt: new Date().toISOString(),
    };
    setCollections((prev) => {
      const next = [newCol, ...prev];
      saveStored('bv_collections', next);
      return next;
    });

    if (newCol.status === 'tahsil_edildi') {
      // Cari bakiyesini düşür
      setCustomers((prev) => {
        const next = prev.map((c) =>
          c.id === newCol.customerId ? { ...c, balance: Math.max(0, (c.balance || 0) - newCol.amount) } : c
        );
        saveStored('bv_customers', next);
        return next;
      });
    }

    showToast(`✓ Tahsilat Kaydedildi: ₺${newCol.amount.toLocaleString('tr-TR')}`);
  };

  const markCollectionReceived = async (id: string) => {
    const col = collections.find((c) => c.id === id);
    if (!col) return;

    setCollections((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, status: 'tahsil_edildi' as const, date: new Date().toISOString().split('T')[0] } : c
      );
      saveStored('bv_collections', next);
      return next;
    });

    // Müşteri cari bakiyesinden düş
    setCustomers((prev) => {
      const next = prev.map((c) =>
        c.id === col.customerId ? { ...c, balance: Math.max(0, (c.balance || 0) - col.amount) } : c
      );
      saveStored('bv_customers', next);
      return next;
    });

    // Faturadaki paidAmount'u güncelle
    if (col.invoiceId) {
      setInvoices((prev) => {
        const next = prev.map((inv) => {
          if (inv.id === col.invoiceId) {
            const newPaid = (inv.paidAmount || 0) + col.amount;
            return {
              ...inv,
              paidAmount: newPaid,
              status: newPaid >= inv.totalAmount ? ('paid' as InvoiceStatus) : ('partially_paid' as InvoiceStatus),
            };
          }
          return inv;
        });
        saveStored('bv_invoices', next);
        return next;
      });
    }

    logAction('TAHSİLAT_ALINDI', 'Finans', id, `${col.customerName} cari hesabından ₺${col.amount.toLocaleString('tr-TR')} tahsil edildi.`);
    showToast(`✓ ₺${col.amount.toLocaleString('tr-TR')} Tahsilat Hesaba Geçti`);
  };

  const addPayment = async (payData: Omit<Payment, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newPay: Payment = {
      ...payData,
      id,
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => {
      const next = [newPay, ...prev];
      saveStored('bv_payments', next);
      return next;
    });
    showToast(`✓ Ödeme Emri Oluşturuldu: ₺${newPay.amount.toLocaleString('tr-TR')}`);
  };

  const markPaymentPaid = async (id: string) => {
    const pay = payments.find((p) => p.id === id);
    if (!pay) return;

    setPayments((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, status: 'odendi' as const, paymentDate: new Date().toISOString().split('T')[0] } : p
      );
      saveStored('bv_payments', next);
      return next;
    });
    logAction('ODEME_YAPILDI', 'Finans', id, `${pay.recipientName} alıcısına ₺${pay.amount.toLocaleString('tr-TR')} ödendi.`);
    showToast(`✓ Ödeme Tamamlandı: ₺${pay.amount.toLocaleString('tr-TR')}`);
  };

  // ==========================================
  // ÜYELİK & RLS PERSONEL EŞLEŞTİRME
  // ==========================================
  const requestMembership = async (
    tcNoOrHash: string,
    requestedRole: AppRole,
    personnelId?: string
  ): Promise<{ success: boolean; message: string }> => {
    // KVKK: never send plaintext TC
    tcNoOrHash = (await hashTcIdentity(tcNoOrHash)) || tcNoOrHash;
    const id = generateUuid();

    // Personel TC eşleştirmesi ara
    let matchedPerson = personnel.find((p) => p.tcNo === tcNoOrHash || p.id === personnelId);

    const newMem: Membership = {
      id,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userFullName: currentUser.fullName,
      requestedRole,
      tcHashOrNo: tcNoOrHash,
      personnelId: matchedPerson?.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (!sb) return { success: false, message: 'Supabase bağlantısı yok. Üyelik başvurusu gönderilemedi.' };
    const { error: membershipError } = await sb.from('memberships').insert({
      id,
      user_id: newMem.userId,
      user_email: newMem.userEmail,
      user_full_name: newMem.userFullName,
      personnel_id: newMem.personnelId || null,
      tc_hash_or_no: newMem.tcHashOrNo,
      status: 'pending',
      requested_role: newMem.requestedRole,
    });
    if (membershipError) return { success: false, message: `Üyelik başvurusu kaydedilemedi: ${membershipError.message}` };

    setMemberships((prev) => {
      const next = [newMem, ...prev];
      saveStored('bv_memberships', next);
      return next;
    });

    await addApproval({
      kind: 'uyelik_onay',
      status: 'pending',
      title: `Yeni Personel / Rol Onayı: ${currentUser.fullName} (${requestedRole.toUpperCase()})`,
      personName: currentUser.fullName,
      note: `TC No / Hash: ${tcNoOrHash} | Eşleşen Personel: ${matchedPerson ? matchedPerson.fullName : 'Yeni Eşleştirme Gerekli'}`,
    });

    logAction('UYELIK_TALEBI', 'Auth', id, `${currentUser.fullName} rol onayı ve personel eşleştirmesi istedi.`);
    return {
      success: true,
      message: 'Üyelik ve personel eşleştirme talebiniz yönetici onayına sunuldu. Onaylandığında yetkileriniz aktif olacaktır.',
    };
  };

  const approveMembership = async (id: string) => {
    const mem = memberships.find((m) => m.id === id);
    if (!mem) return;
    if (!['founder', 'admin'].includes(currentUser.role)) throw new Error('Üyelik onayı yalnızca founder veya admin tarafından yapılabilir.');
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const { error: membershipError } = await sb.from('memberships').update({ status: 'approved', approved_by: currentUser.id, approved_at: new Date().toISOString() }).eq('id', id);
    if (membershipError) throw membershipError;
    const { error: profileError } = await sb.from('profiles').update({ role: mem.requestedRole, status: 'aktif', personnel_id: mem.personnelId || null, updated_at: new Date().toISOString() }).eq('id', mem.userId);
    if (profileError) throw profileError;

    setMemberships((prev) => {
      const next = prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'approved' as const,
              approvedBy: currentUser.fullName,
              approvedAt: new Date().toISOString(),
            }
          : m
      );
      saveStored('bv_memberships', next);
      return next;
    });

    // Kullanıcı profilini güncelle
    setUserProfiles((prev) => {
      const next = prev.map((u) =>
        u.id === mem.userId
          ? {
              ...u,
              role: mem.requestedRole,
              personnelId: mem.personnelId || u.personnelId,
            }
          : u
      );
      saveStored('bv_user_profiles', next);
      return next;
    });

    if (currentUser.id === mem.userId) {
      setActiveRole(mem.requestedRole);
      setCurrentUser((prev) => ({
        ...prev,
        role: mem.requestedRole,
        personnelId: mem.personnelId || prev.personnelId,
      }));
    }

    logAction('UYELIK_ONAYLANDI', 'Auth', id, `${mem.userFullName} kullanıcısının ${mem.requestedRole} yetkisi onaylandı.`);
    showToast(`✓ Üyelik ve Yetki Onaylandı: ${mem.userFullName}`);
  };

  const rejectMembership = async (id: string, reason: string) => {
    if (!['founder', 'admin'].includes(currentUser.role)) throw new Error('Üyelik reddi yalnızca founder veya admin tarafından yapılabilir.');
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const { error: membershipError } = await sb.from('memberships').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    if (membershipError) throw membershipError;
    setMemberships((prev) => {
      const next = prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'rejected' as const,
              rejectionReason: reason,
            }
          : m
      );
      saveStored('bv_memberships', next);
      return next;
    });
    showToast('Üyelik talebi reddedildi.');
  };

  // ==========================================
  // PERSONEL MAAŞ & BORDRO HESAPLAMA MOTORU
  // ==========================================
  const calculatePayroll = async (month: string): Promise<PayrollRun> => {
    const runId = generateUuid();
    const activeStaff = personnel.filter((p) => p.status === 'aktif');

    let totalBase = 0;
    let totalOvertimePay = 0;
    let totalAdvancesDeducted = 0;
    let totalNet = 0;

    const items: PayrollItem[] = activeStaff.map((p) => {
      const baseSalary = p.salary || 35000;
      const hourlyBase = baseSalary / 225; // 225 saat standart aylık iş kanunu esası

      // İlgili ayın onaylı mesaileri
      const approvedOT = overtimes
        .filter((o) => o.personId === p.id && o.status === 'approved' && o.date.startsWith(month))
        .reduce((sum, o) => sum + o.totalHours, 0);

      const overtimePay = Math.round(hourlyBase * 1.5 * approvedOT);

      // İlgili ayın onaylı avansları
      const advanceDeduction = advances
        .filter((a) => a.personId === p.id && (a.status === 'approved' || a.status === 'paid') && a.requestDate.startsWith(month))
        .reduce((sum, a) => sum + a.amount, 0);

      const netSalary = Math.max(0, baseSalary + overtimePay - advanceDeduction);

      totalBase += baseSalary;
      totalOvertimePay += overtimePay;
      totalAdvancesDeducted += advanceDeduction;
      totalNet += netSalary;

      return {
        id: generateUuid(),
        payrollRunId: runId,
        personId: p.id,
        personName: p.fullName,
        employeeNo: p.employeeNo,
        roleKind: p.kind,
        baseSalary,
        normalDays: 26,
        overtimeHours: approvedOT,
        overtimePay,
        advancesDeduction: advanceDeduction,
        netSalary,
        status: 'draft',
      };
    });

    const newRun: PayrollRun = {
      id: runId,
      month,
      totalBaseSalary: totalBase,
      totalOvertimePay,
      totalAdvancesDeducted,
      totalNetSalary: totalNet,
      personCount: activeStaff.length,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok. Bordro remote kaydedilemedi.');
    const { error: runError } = await sb.from('payroll_runs').upsert({
      id: runId, month, total_persons: newRun.personCount, total_gross: totalBase,
      total_net: totalNet, total_overtime_pay: totalOvertimePay, status: 'draft', updated_at: new Date().toISOString(),
    }, { onConflict: 'month' });
    if (runError) throw runError;
    const { error: itemsError } = await sb.from('payroll_items').insert(items.map((item) => ({
      id: item.id, payroll_run_id: runId, personnel_id: item.personId, month,
      base_salary: item.baseSalary, overtime_pay: item.overtimePay,
      advance_deduction: item.advancesDeduction, net_pay: item.netSalary, status: 'draft',
    })));
    if (itemsError) throw itemsError;

    setPayrollRuns((prev) => {
      const filtered = prev.filter((r) => r.month !== month);
      const next = [newRun, ...filtered];
      saveStored('bv_payroll_runs', next);
      return next;
    });

    setPayrollItems((prev) => {
      const filtered = prev.filter((i) => i.payrollRunId !== runId);
      const next = [...items, ...filtered];
      saveStored('bv_payroll_items', next);
      return next;
    });

    logAction('MAAS_HESAPLANDI', 'Maaş', runId, `${month} dönemi maaş ve bordro hesaplandı (${activeStaff.length} personel).`);
    showToast(`✓ ${month} Dönemi Bordrosu Hesaplandı (Toplam: ₺${totalNet.toLocaleString('tr-TR')})`);

    return newRun;
  };

  const approvePayrollRun = async (runId: string) => {
    if (!['founder', 'admin', 'yonetici', 'muhasebe'].includes(currentUser.role)) throw new Error('Bordro onayı için yetkiniz yok.');
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const { error } = await sb.from('payroll_runs').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', runId);
    if (error) throw error;
    const { error: itemError } = await sb.from('payroll_items').update({ status: 'approved' }).eq('payroll_run_id', runId);
    if (itemError) throw itemError;
    setPayrollRuns((prev) => {
      const next = prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              status: 'approved' as PayrollStatus,
              approvedBy: currentUser.fullName,
              approvedAt: new Date().toISOString(),
            }
          : r
      );
      saveStored('bv_payroll_runs', next);
      return next;
    });

    setPayrollItems((prev) => {
      const next = prev.map((i) => (i.payrollRunId === runId ? { ...i, status: 'approved' as const } : i));
      saveStored('bv_payroll_items', next);
      return next;
    });

    logAction('MAAS_BORDROSU_ONAYLANDI', 'Maaş', runId, 'Maaş bordrosu kesinleştirildi ve ödemeye açıldı.');
    showToast('✓ Maaş bordrosu yönetici tarafından onaylandı.');
  };

  const payPayrollRun = async (runId: string, paymentMethod: 'banka' | 'nakit' = 'banka') => {
    const run = payrollRuns.find((r) => r.id === runId);
    if (!run) return;
    if (!['founder', 'admin', 'muhasebe'].includes(currentUser.role)) throw new Error('Bordro ödemesi için yetkiniz yok.');
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const { error } = await sb.from('payroll_runs').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', runId);
    if (error) throw error;
    const { error: itemError } = await sb.from('payroll_items').update({ status: 'paid' }).eq('payroll_run_id', runId);
    if (itemError) throw itemError;

    setPayrollRuns((prev) => {
      const next = prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              status: 'paid' as PayrollStatus,
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod,
            }
          : r
      );
      saveStored('bv_payroll_runs', next);
      return next;
    });

    setPayrollItems((prev) => {
      const next = prev.map((i) => (i.payrollRunId === runId ? { ...i, status: 'paid' as const } : i));
      saveStored('bv_payroll_items', next);
      return next;
    });

    // Otomatik muhasebe ödemesi kaydet
    await addPayment({
      recipientType: 'personel',
      recipientName: `Tüm Personel (${run.personCount} Kişi)`,
      category: 'maas',
      amount: run.totalNetSalary,
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod === 'banka' ? 'havale' : 'nakit',
      status: 'odendi',
      notes: `${run.month} dönemi personel maaş ödemesi toplu transferi`,
    });

    logAction('MAASLAR_ODENDI', 'Maaş', runId, `${run.month} dönemi ₺${run.totalNetSalary.toLocaleString('tr-TR')} tutarındaki maaşlar ödendi.`);
    showToast(`✓ Maaşlar Ödendi (₺${run.totalNetSalary.toLocaleString('tr-TR')})`);
  };

  const addPayrollPayment = async (payrollItemId: string, amount: number, paymentMethod: 'banka' | 'nakit' = 'banka', note?: string) => {
    if (!['founder', 'admin', 'muhasebe', 'yonetici'].includes(currentUser.role)) throw new Error('Maaş ödemesi için yetkiniz yok.');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Ödeme tutarı sıfırdan büyük olmalıdır.');
    const item = payrollItems.find((row) => row.id === payrollItemId);
    if (!item) throw new Error('Bordro kalemi bulunamadı.');
    const paid = payrollPayments.filter((payment) => payment.payrollItemId === payrollItemId).reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = item.netSalary - paid;
    if (amount > remaining + 0.005) throw new Error(`Ödeme tutarı kalan bakiyeyi aşamaz. Kalan: ₺${remaining.toLocaleString('tr-TR')}`);
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase bağlantısı yok.');
    const { data, error } = await sb.from('payroll_payments').insert({ payroll_item_id: payrollItemId, payroll_run_id: item.payrollRunId || item.runId, personnel_id: item.personId || item.personnelId, amount, payment_method: paymentMethod, note, paid_by: currentUser.id }).select('id, payroll_item_id, payroll_run_id, personnel_id, amount, payment_method, payment_date, note, paid_by, created_at').single();
    if (error) throw error;
    const payment: PayrollPayment = { id: data.id, payrollItemId: data.payroll_item_id, payrollRunId: data.payroll_run_id, personnelId: data.personnel_id, amount: Number(data.amount), paymentMethod: data.payment_method, paymentDate: data.payment_date, note: data.note, paidBy: data.paid_by, createdAt: data.created_at };
    setPayrollPayments((prev) => { const next = [payment, ...prev]; saveStored('bv_payroll_payments', next); return next; });
    logAction('MAAS_PARCALI_ODEME', 'Maaş', payrollItemId, `₺${amount.toFixed(2)} ${paymentMethod} ödeme kaydedildi.`);
    showToast(`✓ ₺${amount.toLocaleString('tr-TR')} parçalı maaş ödemesi kaydedildi.`);
  };

  // Veritabanı Yeniden Bağlantı
  const retryDbConnection = async () => {
    setDbError(null);
    showToast('Supabase bağlantısı tekrar deneniyor...');
    await refreshFromDb();
  };

  // Harita Telemetrisi
  const telemetry: TelemetryPoint[] = useMemo(() => {
    return cranes.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.type,
      status: c.status,
      lat: c.lat,
      lng: c.lng,
      operator: c.operator,
      site: c.site,
    }));
  }, [cranes]);

  const currentOperator = useMemo(
    () => personnel.find((p) => p.id === currentOperatorId) || personnel[0] || EMPTY_PERSON,
    [personnel, currentOperatorId]
  );

  const updateCraneStatus = useCallback(
    async (id: string, status: CraneStatus) => {
      await updateCrane(id, { status });
    },
    [updateCrane]
  );

  // Global Gerçek İstatistikler (Dynamic KPIs)
  const stats = useMemo(() => {
    const activePers = personnel.filter((p) => p.status === 'aktif').length;
    const actCranes = cranes.filter((c) => c.status === 'sahada').length;
    const pendApps = approvals.filter((a) => a.status === 'pending').length;
    const rev = receipts.filter((r) => r.status === 'kesildi').reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter((e) => e.status !== 'iptal').reduce((s, e) => s + e.amount, 0);
    const fuel = expenses.filter((e) => e.category === 'yakit' && e.status !== 'iptal').reduce((s, e) => s + e.amount, 0);
    const todayExp = expenses.filter((e) => e.category === 'masraf' && e.status !== 'iptal').reduce((s, e) => s + e.amount, 0);
    const cutCount = receipts.filter((r) => r.status === 'kesildi').length;
    const pendCount = receipts.filter((r) => r.status === 'birikti').length;
    const otHours = approvals
      .filter((a) => a.kind === 'mesai' && a.status === 'approved')
      .reduce((s, a) => s + (a.hours || 0), 0);

    const unInvoicedReceipts = jobReceipts.filter((r) => r.status === 'approved' && !r.invoiced);
    const unInvoicedCount = unInvoicedReceipts.length;
    const unInvoicedTotal = unInvoicedReceipts.reduce((sum, r) => sum + r.amount, 0);

    const pendingCollections = collections
      .filter((c) => c.status === 'bekliyor')
      .reduce((sum, c) => sum + c.amount, 0);

    const pendingPayments = payments
      .filter((p) => p.status === 'bekliyor')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPersonnel: personnel.length,
      activePersonnel: activePers,
      totalCranes: cranes.length,
      totalCranesCount: cranes.length,
      activeCranes: actCranes,
      activeCranesCount: actCranes,
      pendingApprovals: pendApps,
      pendingApprovalsCount: pendApps,
      totalRevenue: rev,
      todayRevenue: rev,
      totalExpense: exp,
      todayExpenses: todayExp,
      todayFuel: fuel,
      cutReceiptsCount: cutCount,
      pendingReceiptsCount: pendCount,
      unInvoicedReceiptsCount: unInvoicedCount,
      unInvoicedReceiptsTotal: unInvoicedTotal,
      pendingCollectionsTotal: pendingCollections,
      pendingPaymentsTotal: pendingPayments,
      monthlyOvertimeHours: otHours,
    };
  }, [personnel, cranes, approvals, receipts, expenses, jobReceipts, collections, payments]);

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAuthReady,
        userProfiles,
        activeRole,
        setActiveRole,
        loginWithCredentials,
        registerUser,
        logout,
        updateUserProfile,
        changePassword,
        uploadProfileAvatar,
        personnel,
        addPerson,
        updatePerson,
        deletePerson,
        exitPerson,
        personnelDocuments,
        uploadPersonnelDocument,
        personnelTypes,
        addPersonnelType,
        memberships,
        requestMembership,
        approveMembership,
        rejectMembership,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        sites,
        addSite,
        quotes,
        addQuote,
        contracts,
        createContractFromQuote,
        jobReceipts,
        addJobReceipt,
        updateJobReceipt,
        approveJobReceipt,
        rejectJobReceipt,
        invoices,
        createInvoiceFromReceipts,
        updateInvoiceStatus,
        collections,
        addCollection,
        markCollectionReceived,
        payments,
        addPayment,
        markPaymentPaid,
        payrollRuns,
        payrollItems,
        payrollPayments,
        addPayrollPayment,
        calculatePayroll,
        approvePayrollRun,
        payPayrollRun,
        cranes,
        addCrane,
        updateCrane,
        updateCraneStatus,
        deleteCrane,
        approvals,
        addApproval,
        approveRequest,
        rejectRequest,
        attendance,
        recordAttendance,
        leaves,
        createLeaveRequest,
        updateLeaveStatus,
        overtimes,
        createOvertimeRequest,
        updateOvertimeStatus,
        advances,
        createAdvanceRequest,
        updateAdvanceStatus,
        puantajRecords,
        periodLocks,
        generateMonthlyPuantaj,
        togglePeriodLock,
        updatePuantajRecord,
        receipts,
        addReceipt,
        updateReceipt,
        expenses,
        addExpense,
        updateExpense,
        auditLogs,
        logAction,
        notifications,
        markNotificationRead,
        markNotificationAsRead: markNotificationRead,
        sendNotification,
        telemetry,
        stats,
        currentOperator,
        setCurrentOperatorId,
        toastMessage,
        showToast,
        isSyncing,
        dbConnected,
        isSupabaseOnline: dbConnected,
        dbError,
        retryDbConnection,
        refreshFromDb,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const ctx = useContext(ERPContext);
  if (!ctx) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return ctx;
};
