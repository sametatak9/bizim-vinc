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
} from '../types';
import { getSupabase, isSupabaseConfigured, generateUuid } from './supabase';

interface ERPContextType {
  // Auth & Roles
  currentUser: UserProfile;
  userProfiles: UserProfile[];
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  switchUser: (userId: string) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (email: string, pass: string, fullName: string, role: AppRole, phone?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => void;

  // Personel
  personnel: Person[];
  addPerson: (person: Omit<Person, 'id'>) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string, soft?: boolean) => Promise<void>;

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

  // Finans
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
  markNotificationRead: (id: string) => void;
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
    monthlyOvertimeHours: number;
  };

  currentOperator: Person;
  setCurrentOperatorId: (id: string) => void;

  // UI Geri Bildirim
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isSyncing: boolean;
  dbConnected: boolean;
  isSupabaseOnline: boolean;
  refreshFromDb: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | null>(null);

// Başlangıç Kullanıcı Profilleri
const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@bizimvinc.com',
    fullName: 'Ahmet Yılmaz',
    role: 'admin',
    phone: '+90 532 100 00 01',
    department: 'Genel Yönetim',
    title: 'Genel Müdür / Sistem Yöneticisi',
    status: 'aktif',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-op-01',
    email: 'mehmet.kaya@bizimvinc.com',
    fullName: 'Mehmet Kaya',
    role: 'operator',
    phone: '+90 532 200 00 02',
    department: 'Saha Filosu',
    title: 'Kule Vinç Baş Operatörü',
    personnelId: 'p-1',
    status: 'aktif',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-muh-01',
    email: 'muhasebe@bizimvinc.com',
    fullName: 'Canan Demir',
    role: 'muhasebe',
    phone: '+90 532 300 00 03',
    department: 'Finans & Muhasebe',
    title: 'Mali İşler Sorumlusu',
    status: 'aktif',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-puan-01',
    email: 'puantor@bizimvinc.com',
    fullName: 'Murat Arslan',
    role: 'puantor',
    phone: '+90 532 400 00 04',
    department: 'İnsan Kaynakları',
    title: 'Saha Puantörü & Vardiya Amiri',
    status: 'aktif',
    createdAt: new Date().toISOString(),
  },
];

// Başlangıç Personel Listesi
const INITIAL_PERSONNEL: Person[] = [
  {
    id: 'p-1',
    employeeNo: 'OP-204',
    fullName: 'Mehmet Kaya',
    tcNo: '12345678901',
    phone: '+90 532 200 00 02',
    email: 'mehmet.kaya@bizimvinc.com',
    address: 'Ataşehir, İstanbul',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    department: 'Saha Operasyon',
    salary: 45000,
    iban: 'TR330006100511123456789001',
    startDate: '2023-04-15',
    title: 'Kule Vinç Baş Operatörü',
    initials: 'MK',
    cardSlug: 'mehmet-kaya',
    documentsOk: true,
    certExpiring: false,
    userId: 'usr-op-01',
    createdAt: '2023-04-15T08:00:00Z',
  },
  {
    id: 'p-2',
    employeeNo: 'OP-118',
    fullName: 'Ali Demir',
    tcNo: '23456789012',
    phone: '+90 533 300 00 02',
    email: 'ali.demir@bizimvinc.com',
    address: 'Kartal, İstanbul',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    department: 'Saha Operasyon',
    salary: 42000,
    iban: 'TR330006100511123456789002',
    startDate: '2023-06-01',
    title: 'Mobil Vinç Operatörü',
    initials: 'AD',
    cardSlug: 'ali-demir',
    documentsOk: true,
    certExpiring: false,
    createdAt: '2023-06-01T08:00:00Z',
  },
  {
    id: 'p-3',
    employeeNo: 'OP-302',
    fullName: 'Hasan Yılmaz',
    tcNo: '34567890123',
    phone: '+90 535 400 00 03',
    email: 'hasan.yilmaz@bizimvinc.com',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'musait',
    department: 'Saha Operasyon',
    salary: 40000,
    startDate: '2023-08-10',
    title: 'Hiyap Vinç Operatörü',
    initials: 'HY',
    cardSlug: 'hasan-yilmaz',
    documentsOk: true,
    certExpiring: true,
    createdAt: '2023-08-10T08:00:00Z',
  },
  {
    id: 'p-4',
    employeeNo: 'YD-101',
    fullName: 'Burak Can',
    tcNo: '45678901234',
    phone: '+90 536 500 00 04',
    kind: 'yardimci',
    status: 'aktif',
    poolStatus: 'gorevli',
    department: 'Saha Destek',
    salary: 28000,
    startDate: '2024-01-10',
    title: 'Sapan & Rigger Görevlisi',
    initials: 'BC',
    cardSlug: 'burak-can',
    documentsOk: true,
    certExpiring: false,
    createdAt: '2024-01-10T08:00:00Z',
  },
];

// Başlangıç Vinç Filosu
const INITIAL_CRANES: Crane[] = [
  {
    id: 'cr-1',
    code: 'V-204',
    type: 'Mobil Vinç (Liebherr LTM 1100)',
    status: 'sahada',
    capacity: '100 ton',
    operator: 'Mehmet Kaya',
    site: 'Ataşehir Metro Şantiyesi',
    lastService: '2026-08-15',
    lat: 41.0025,
    lng: 29.1123,
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'cr-2',
    code: 'V-118',
    type: 'Paletli Vinç (Tadano GT-750)',
    status: 'sahada',
    capacity: '75 ton',
    operator: 'Ali Demir',
    site: 'Başakşehir Şehir Hastanesi',
    lastService: '2026-08-28',
    lat: 41.0991,
    lng: 28.7758,
    createdAt: '2023-02-10T00:00:00Z',
  },
  {
    id: 'cr-3',
    code: 'V-302',
    type: 'Hiyap Teleskopik Kamyon Üstü',
    status: 'musait',
    capacity: '45 ton',
    operator: 'Hasan Yılmaz',
    site: 'Merkez Garaj / İkitelli',
    lastService: '2026-09-02',
    lat: 41.0543,
    lng: 28.7892,
    createdAt: '2023-03-05T00:00:00Z',
  },
  {
    id: 'cr-4',
    code: 'V-405',
    type: 'Kule Vinç (Potain MDT 219)',
    status: 'bakimda',
    capacity: '10 ton',
    operator: 'Atanmadı',
    site: 'Tuzla Tersane Sahası',
    lastService: '2026-09-10',
    lat: 40.8521,
    lng: 29.2941,
    createdAt: '2023-04-12T00:00:00Z',
  },
];

// Başlangıç Onay Talepleri
const INITIAL_APPROVALS: Approval[] = [
  {
    id: 'ap-1',
    kind: 'avans',
    status: 'pending',
    title: 'Şantiye Yol Masrafı Avansı',
    personId: 'p-1',
    personName: 'Mehmet Kaya',
    personInitials: 'MK',
    amount: 3500,
    requestedDate: '2026-09-12',
    note: 'Ataşehir şantiyesinde gece dökümü için acil yakıt ve konaklama avansı.',
    createdAt: '2026-09-12T14:30:00Z',
  },
  {
    id: 'ap-2',
    kind: 'izin',
    status: 'pending',
    title: 'Yıllık İzin Talebi',
    personId: 'p-2',
    personName: 'Ali Demir',
    personInitials: 'AD',
    startDate: '2026-09-20',
    endDate: '2026-09-24',
    note: 'Memleket ziyareti için 4 gün izin talep ediyorum.',
    createdAt: '2026-09-12T16:00:00Z',
  },
  {
    id: 'ap-3',
    kind: 'mesai',
    status: 'approved',
    title: 'Gece Beton Dökümü Mesaisi',
    personId: 'p-1',
    personName: 'Mehmet Kaya',
    personInitials: 'MK',
    hours: 3.5,
    note: 'Saat 18:00 - 21:30 arası kalındı. Şantiye şefi teyitli.',
    approvedBy: 'Ahmet Yılmaz',
    approvedAt: '2026-09-11T19:00:00Z',
    createdAt: '2026-09-11T17:45:00Z',
  },
];

// Başlangıç Makbuzlar
const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rc-1',
    receiptNo: 'MK-2026-0891',
    company: 'Enka İnşaat A.Ş.',
    amount: 85000,
    status: 'kesildi',
    craneCode: 'V-204',
    site: 'Ataşehir Metro',
    daysPending: 0,
    createdAt: '2026-09-10T11:00:00Z',
  },
  {
    id: 'rc-2',
    receiptNo: 'MK-2026-0892',
    company: 'Kalyon Altyapı',
    amount: 140000,
    status: 'bekliyor',
    craneCode: 'V-118',
    site: 'Başakşehir Şehir Hastanesi',
    daysPending: 3,
    createdAt: '2026-09-08T15:20:00Z',
  },
];

// Başlangıç Masraflar
const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'ex-1',
    category: 'yakit',
    title: 'Euro Dizel Yakıt Dolumu (250 Litre)',
    amount: 11250,
    craneCode: 'V-204',
    personName: 'Mehmet Kaya',
    stationOrSupplier: 'Shell Ataşehir İstasyonu',
    status: 'aktif',
    createdAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 'ex-2',
    category: 'masraf',
    title: 'Halat & Kanca Yağlama Kiti',
    amount: 4500,
    craneCode: 'V-302',
    personName: 'Hasan Yılmaz',
    stationOrSupplier: 'Tuzla Hırdavat Ltd.',
    status: 'aktif',
    createdAt: '2026-09-11T14:20:00Z',
  },
];

// LocalStorage Yardımcısı
function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
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
    loadStored('bv_user_profiles', INITIAL_PROFILES)
  );
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = loadStored<UserProfile | null>('bv_current_user', null);
    return saved || userProfiles[0];
  });
  const [activeRole, setActiveRole] = useState<AppRole>(currentUser.role);

  // 2. Ana Veri Setleri
  const [personnel, setPersonnel] = useState<Person[]>(() =>
    loadStored('bv_personnel', INITIAL_PERSONNEL)
  );
  const [cranes, setCranes] = useState<Crane[]>(() =>
    loadStored('bv_cranes', INITIAL_CRANES)
  );
  const [approvals, setApprovals] = useState<Approval[]>(() =>
    loadStored('bv_approvals', INITIAL_APPROVALS)
  );
  const [receipts, setReceipts] = useState<Receipt[]>(() =>
    loadStored('bv_receipts', INITIAL_RECEIPTS)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadStored('bv_expenses', INITIAL_EXPENSES)
  );

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
    loadStored('bv_audit_logs', [
      {
        id: 'aud-1',
        userName: 'Sistem Yöneticisi',
        userRole: 'admin',
        action: 'SİSTEM_BAŞLATILDI',
        module: 'Sistem',
        details: 'Bizim Vinç ERP üretim çekirdeği devreye alındı.',
        createdAt: new Date().toISOString(),
      },
    ])
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadStored('bv_notifications', [
      {
        id: 'notif-1',
        title: 'Hoş Geldiniz',
        message: 'Bizim Vinç ERP operasyon paneline bağlandınız.',
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ])
  );

  // UI Durumları
  const [currentOperatorId, setCurrentOperatorId] = useState<string>('p-1');
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

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveStored('bv_notifications', next);
      return next;
    });
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
      const { data: pData } = await sb.from('personnel').select('*');
      if (pData && pData.length > 0) {
        const mapped: Person[] = pData.map((d: any) => ({
          id: d.id,
          employeeNo: d.employee_no || 'OP-000',
          fullName: d.full_name,
          tcNo: d.tc_no,
          phone: d.phone,
          email: d.email,
          address: d.address,
          kind: d.kind,
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

      // 2. Vinçler
      const { data: cData } = await sb.from('cranes').select('*');
      if (cData && cData.length > 0) {
        const mapped: Crane[] = cData.map((d: any) => ({
          id: d.id,
          code: d.code,
          type: d.type,
          status: d.status,
          capacity: d.capacity,
          operator: d.operator,
          site: d.site,
          lastService: d.last_service || '2026-08-01',
          lat: d.lat || 41.01,
          lng: d.lng || 29.0,
          notes: d.notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setCranes(mapped);
        saveStored('bv_cranes', mapped);
      }

      // 3. Onaylar
      const { data: aData } = await sb.from('approvals').select('*').order('created_at', { ascending: false });
      if (aData && aData.length > 0) {
        const mapped: Approval[] = aData.map((d: any) => ({
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

      // 4. Makbuzlar
      const { data: rData } = await sb.from('receipts').select('*').order('created_at', { ascending: false });
      if (rData && rData.length > 0) {
        const mapped: Receipt[] = rData.map((d: any) => ({
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
      const { data: eData } = await sb.from('expenses').select('*').order('created_at', { ascending: false });
      if (eData && eData.length > 0) {
        const mapped: Expense[] = eData.map((d: any) => ({
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

      setDbConnected(true);
    } catch (err) {
      console.error('Supabase fetch error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sayfa yüklendiğinde Supabase'i tara
  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Auth & Kullanıcı Metotları
  const switchUser = useCallback((userId: string) => {
    const found = userProfiles.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setActiveRole(found.role);
      saveStored('bv_current_user', found);
      showToast(`Aktif kullanıcı değiştirildi: ${found.fullName} (${found.role.toUpperCase()})`);
    }
  }, [userProfiles, showToast]);

  const loginWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    // 1. Supabase Auth denemesi
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) {
          // Eğer Supabase'de kullanıcı yoksa veya demo modundaysa yerel kontrol yap
          console.warn('Supabase auth sign in notice:', error.message);
        } else if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || email.split('@')[0],
            role: (data.user.user_metadata?.role as AppRole) || 'admin',
            status: 'aktif',
            createdAt: data.user.created_at,
          };
          setCurrentUser(profile);
          setActiveRole(profile.role);
          saveStored('bv_current_user', profile);
          logAction('GİRİŞ_YAPILDI', 'Auth', data.user.id, 'Supabase Auth ile oturum açıldı.');
          return { success: true, message: `Hoş geldiniz, ${profile.fullName}!` };
        }
      } catch (err) {
        console.warn('Supabase auth err:', err);
      }
    }

    // 2. Yerel Profil Kontrolü
    const matched = userProfiles.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      setActiveRole(matched.role);
      saveStored('bv_current_user', matched);
      logAction('GİRİŞ_YAPILDI', 'Auth', matched.id, 'Yerel hesap ile oturum açıldı.');
      return { success: true, message: `Hoş geldiniz, ${matched.fullName}!` };
    }

    // 3. Otomatik Hızlı Hesap (Eğer bilinmeyen bir e-posta ile giriş istenirse)
    const newProfile: UserProfile = {
      id: generateUuid(),
      email,
      fullName: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : email.includes('op') ? 'operator' : 'personel',
      status: 'aktif',
      createdAt: new Date().toISOString(),
    };
    setUserProfiles((prev) => {
      const next = [newProfile, ...prev];
      saveStored('bv_user_profiles', next);
      return next;
    });
    setCurrentUser(newProfile);
    setActiveRole(newProfile.role);
    saveStored('bv_current_user', newProfile);
    logAction('YENİ_KULLANICI_GİRİŞİ', 'Auth', newProfile.id, 'Yeni profil oluşturularak giriş yapıldı.');
    return { success: true, message: `Giriş başarılı! Rolünüz: ${newProfile.role.toUpperCase()}` };
  };

  const registerUser = async (email: string, pass: string, fullName: string, role: AppRole, phone?: string): Promise<{ success: boolean; message: string }> => {
    const sb = getSupabase();
    let userId = generateUuid();
    if (sb) {
      try {
        const { data, error } = await sb.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: fullName, role, phone },
          },
        });
        if (error) {
          console.warn('Supabase register notice:', error.message);
        } else if (data.user) {
          userId = data.user.id;
        }
      } catch (err) {
        console.warn('Supabase register error:', err);
      }
    }

    const newProfile: UserProfile = {
      id: userId,
      email,
      fullName,
      role,
      phone,
      status: 'aktif',
      createdAt: new Date().toISOString(),
    };

    setUserProfiles((prev) => {
      const updated = [newProfile, ...prev.filter((u) => u.email !== email)];
      saveStored('bv_user_profiles', updated);
      return updated;
    });
    setCurrentUser(newProfile);
    setActiveRole(role);
    saveStored('bv_current_user', newProfile);
    logAction('KULLANICI_KAYIT', 'Auth', userId, `${fullName} yeni kullanıcı olarak kaydoldu.`);
    return { success: true, message: `Kayıt başarılı! ${fullName} olarak oturum açıldı.` };
  };

  const logout = useCallback(() => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut().catch(() => {});
    }
    // Varsayılan yöneticiye dön
    const def = userProfiles[0];
    setCurrentUser(def);
    setActiveRole(def.role);
    saveStored('bv_current_user', def);
    showToast('Oturum kapatıldı.');
  }, [userProfiles, showToast]);

  const updateUserProfile = useCallback((id: string, updates: Partial<UserProfile>) => {
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
  }, [currentUser.id, showToast]);

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

    setPersonnel((prev) => {
      const next = [newPerson, ...prev];
      saveStored('bv_personnel', next);
      return next;
    });

    logAction('PERSONEL_EKLENDİ', 'Personel', id, `${newPerson.fullName} (${newPerson.employeeNo}) eklendi.`);
    showToast(`✓ Personel başarıyla eklendi: ${newPerson.fullName}`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('personnel').insert([
          {
            id: newPerson.id,
            employee_no: newPerson.employeeNo,
            full_name: newPerson.fullName,
            tc_no: newPerson.tcNo,
            phone: newPerson.phone,
            email: newPerson.email,
            address: newPerson.address,
            kind: newPerson.kind,
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
          },
        ]);
      } catch (e) {
        console.error('Remote insert error:', e);
      }
    }
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    setPersonnel((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
      saveStored('bv_personnel', next);
      return next;
    });

    logAction('PERSONEL_GÜNCELLENDİ', 'Personel', id, `Personel kaydı güncellendi.`);
    showToast('✓ Personel bilgileri güncellendi.');

    const sb = getSupabase();
    if (sb) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.status) payload.status = updates.status;
        if (updates.poolStatus) payload.pool_status = updates.poolStatus;
        if (updates.salary !== undefined) payload.salary = updates.salary;
        if (updates.title) payload.title = updates.title;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        await sb.from('personnel').update(payload).eq('id', id);
      } catch (e) {
        console.error('Remote update error:', e);
      }
    }
  };

  const deletePerson = async (id: string, soft = true) => {
    if (soft) {
      await updatePerson(id, { status: 'pasif', poolStatus: 'havuzda' });
      showToast('Personel pasife alındı (Arşivlendi).');
    } else {
      setPersonnel((prev) => {
        const next = prev.filter((p) => p.id !== id);
        saveStored('bv_personnel', next);
        return next;
      });
      logAction('PERSONEL_SİLİNDİ', 'Personel', id, 'Personel kalıcı olarak silindi.');
      showToast('Personel sistemden kaldırıldı.');

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('personnel').delete().eq('id', id);
        } catch (e) {
          console.error('Remote delete error:', e);
        }
      }
    }
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
        await sb.from('cranes').insert([
          {
            id: newCrane.id,
            code: newCrane.code,
            type: newCrane.type,
            status: newCrane.status,
            capacity: newCrane.capacity,
            operator: newCrane.operator,
            site: newCrane.site,
            last_service: newCrane.lastService,
            lat: newCrane.lat,
            lng: newCrane.lng,
            notes: newCrane.notes,
          },
        ]);
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
        await sb.from('cranes').update(payload).eq('id', id);
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

    const newRecord: AttendanceRecord = {
      id: generateUuid(),
      personId,
      personName,
      date,
      checkInTime: checkIn || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: checkOut,
      status,
      note,
      createdAt: new Date().toISOString(),
    };

    setAttendance((prev) => {
      const filtered = prev.filter((a) => !(a.personId === personId && a.date === date));
      const next = [newRecord, ...filtered];
      saveStored('bv_attendance', next);
      return next;
    });

    logAction('YOKLAMA_KAYDI', 'Puantaj', personId, `${personName} bugünkü durumu: ${status.toUpperCase()}`);
    showToast(`✓ ${personName} yoklaması kaydedildi (${status}).`);

    // Onay listesine de ekle
    await addApproval({
      kind: 'yoklama',
      status: 'approved',
      title: `Günlük Yoklama: ${status.toUpperCase()}`,
      personId,
      personName,
      requestedDate: date,
      note: note || `Giriş: ${newRecord.checkInTime || '-'}`,
    });
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
    () => personnel.find((p) => p.id === currentOperatorId) || personnel[0] || INITIAL_PERSONNEL[0],
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
      monthlyOvertimeHours: otHours,
    };
  }, [personnel, cranes, approvals, receipts, expenses]);

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        userProfiles,
        activeRole,
        setActiveRole,
        switchUser,
        loginWithCredentials,
        registerUser,
        logout,
        updateUserProfile,
        personnel,
        addPerson,
        updatePerson,
        deletePerson,
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
