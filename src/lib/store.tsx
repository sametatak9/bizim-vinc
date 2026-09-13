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

  // Üyelik & Eşleştirme
  memberships: Membership[];
  requestMembership: (tcNoOrHash: string, requestedRole: AppRole, personnelId?: string) => Promise<{ success: boolean; message: string }>;
  approveMembership: (id: string) => Promise<void>;
  rejectMembership: (id: string, reason: string) => Promise<void>;

  // Cari (Customers) & Şantiye (Sites)
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  sites: Site[];
  addSite: (site: Omit<Site, 'id' | 'createdAt'>) => Promise<void>;

  // Makbuz -> Fatura Hattı
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

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    title: 'Kalyon İnşaat San. ve Tic. A.Ş.',
    vknTckn: '4920194812',
    authorizedPerson: 'Mustafa Yıldırım',
    phone: '+90 212 555 10 20',
    email: 'muhasebe@kalyon.com',
    address: 'Ümraniye Finans Merkezi Şantiyesi, İstanbul',
    taxOffice: 'Kozyatağı V.D.',
    balance: 185000,
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'cust-2',
    title: 'Limak İnşaat A.Ş.',
    vknTckn: '6080219482',
    authorizedPerson: 'Serdar Kaya',
    phone: '+90 216 444 30 40',
    email: 'finans@limak.com.tr',
    address: 'Sabiha Gökçen Metro Uzatma Şantiyesi, Pendik',
    taxOffice: 'Kadıköy V.D.',
    balance: 92000,
    createdAt: '2026-08-10T10:30:00Z',
  },
  {
    id: 'cust-3',
    title: 'Tekfen İnşaat ve Tesisat A.Ş.',
    vknTckn: '8360182741',
    authorizedPerson: 'Engin Vural',
    phone: '+90 212 359 00 00',
    email: 'saha@tekfen.com.tr',
    address: 'Tuzla Tersane Genişletme Projesi, İstanbul',
    taxOffice: 'Tuzla V.D.',
    balance: 45000,
    createdAt: '2026-08-20T11:00:00Z',
  },
];

const INITIAL_SITES: Site[] = [
  {
    id: 'site-1',
    name: 'Finans Merkezi Kule 3',
    customerId: 'cust-1',
    customerName: 'Kalyon İnşaat San. ve Tic. A.Ş.',
    location: 'Ataşehir / İstanbul',
    contactPerson: 'Cemil Şantiye Şefi',
    phone: '+90 532 999 11 22',
    status: 'aktif',
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'site-2',
    name: 'Pendik Metro İstasyon Kazısı',
    customerId: 'cust-2',
    customerName: 'Limak İnşaat A.Ş.',
    location: 'Pendik / İstanbul',
    contactPerson: 'Hakan Şef',
    phone: '+90 533 888 22 33',
    status: 'aktif',
    createdAt: '2026-08-10T10:30:00Z',
  },
  {
    id: 'site-3',
    name: 'Tuzla Tersane Rıhtım 2',
    customerId: 'cust-3',
    customerName: 'Tekfen İnşaat ve Tesisat A.Ş.',
    location: 'Tuzla / İstanbul',
    contactPerson: 'Levent Mühendis',
    phone: '+90 535 777 33 44',
    status: 'aktif',
    createdAt: '2026-08-20T11:00:00Z',
  },
];

const INITIAL_JOB_RECEIPTS: JobReceipt[] = [
  {
    id: 'jrec-1',
    receiptNo: 'MB-2026-0001',
    customerId: 'cust-1',
    customerName: 'Kalyon İnşaat San. ve Tic. A.Ş.',
    siteId: 'site-1',
    siteName: 'Finans Merkezi Kule 3',
    craneCode: 'V-204',
    operatorId: 'p-1',
    operatorName: 'Mehmet Kaya',
    date: '2026-09-11',
    startTime: '08:00',
    endTime: '18:00',
    workingHours: 10,
    description: '35 tonluk prefabrik kolon montajı ve çelik kiriş yerleşimi',
    amount: 38000,
    status: 'approved',
    invoiced: false,
    approvedBy: 'Ahmet Yılmaz',
    approvedAt: '2026-09-11T19:00:00Z',
    createdAt: '2026-09-11T18:15:00Z',
  },
  {
    id: 'jrec-2',
    receiptNo: 'MB-2026-0002',
    customerId: 'cust-2',
    customerName: 'Limak İnşaat A.Ş.',
    siteId: 'site-2',
    siteName: 'Pendik Metro İstasyon Kazısı',
    craneCode: 'V-118',
    operatorId: 'p-2',
    operatorName: 'Ali Demir',
    date: '2026-09-12',
    startTime: '09:00',
    endTime: '17:00',
    workingHours: 8,
    description: 'TBM tünel segmenti indirme ve ağır pompa montajı',
    amount: 32000,
    status: 'approved',
    invoiced: false,
    approvedBy: 'Ahmet Yılmaz',
    approvedAt: '2026-09-12T18:00:00Z',
    createdAt: '2026-09-12T17:30:00Z',
  },
  {
    id: 'jrec-3',
    receiptNo: 'MB-2026-0003',
    customerId: 'cust-3',
    customerName: 'Tekfen İnşaat ve Tesisat A.Ş.',
    siteId: 'site-3',
    siteName: 'Tuzla Tersane Rıhtım 2',
    craneCode: 'V-302',
    operatorId: 'p-3',
    operatorName: 'Hasan Yılmaz',
    date: '2026-09-13',
    startTime: '08:30',
    endTime: '16:30',
    workingHours: 8,
    description: 'Gemi sacı ve jeneratör bloğu yükleme operasyonu',
    amount: 24000,
    status: 'pending_approval',
    invoiced: false,
    createdAt: '2026-09-13T06:45:00Z',
  },
  {
    id: 'jrec-4',
    receiptNo: 'MB-2026-0004',
    customerId: 'cust-1',
    customerName: 'Kalyon İnşaat San. ve Tic. A.Ş.',
    siteId: 'site-1',
    siteName: 'Finans Merkezi Kule 3',
    craneCode: 'V-204',
    operatorId: 'p-1',
    operatorName: 'Mehmet Kaya',
    date: '2026-09-08',
    startTime: '08:00',
    endTime: '20:00',
    workingHours: 12,
    description: 'Kule vinç bom uzatması ve çelik halat gerdirme mesaisi',
    amount: 46000,
    status: 'invoiced',
    invoiced: true,
    invoiceId: 'inv-1',
    invoiceNo: 'FT-2026-0001',
    approvedBy: 'Ahmet Yılmaz',
    approvedAt: '2026-09-08T21:00:00Z',
    createdAt: '2026-09-08T20:30:00Z',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNo: 'FT-2026-0001',
    customerId: 'cust-1',
    customerName: 'Kalyon İnşaat San. ve Tic. A.Ş.',
    receiptIds: ['jrec-4'],
    issueDate: '2026-09-09',
    dueDate: '2026-09-24',
    subtotal: 46000,
    taxRate: 20,
    taxAmount: 9200,
    totalAmount: 55200,
    paidAmount: 0,
    status: 'issued',
    notes: 'Kule 3 montaj hizmet bedeli faturası',
    createdAt: '2026-09-09T10:00:00Z',
  },
];

const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    customerId: 'cust-1',
    customerName: 'Kalyon İnşaat San. ve Tic. A.Ş.',
    invoiceId: 'inv-1',
    invoiceNo: 'FT-2026-0001',
    amount: 55200,
    dueDate: '2026-09-24',
    date: '2026-09-24',
    paymentMethod: 'havale',
    status: 'bekliyor',
    notes: 'Vadesi 24 Eylül olan fatura tahsilatı',
    createdAt: '2026-09-09T10:05:00Z',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    recipientType: 'tedarikci',
    recipientName: 'Opet Petrolcülük A.Ş.',
    category: 'yakit',
    amount: 28500,
    dueDate: '2026-09-20',
    paymentMethod: 'havale',
    status: 'bekliyor',
    notes: 'Aylık filo mazot cari faturası',
    createdAt: '2026-09-10T11:00:00Z',
  },
  {
    id: 'pay-2',
    recipientType: 'tedarikci',
    recipientName: 'Borusan Cat Servis',
    category: 'bakim',
    amount: 14000,
    dueDate: '2026-09-18',
    paymentMethod: 'havale',
    status: 'bekliyor',
    notes: 'V-118 500 saat periyodik hidrolik bakımı',
    createdAt: '2026-09-11T15:00:00Z',
  },
];

const INITIAL_MEMBERSHIPS: Membership[] = [
  {
    id: 'mem-1',
    userId: 'usr-new-01',
    userEmail: 'kemal.usta@gmail.com',
    userFullName: 'Kemal Usta',
    requestedRole: 'operator',
    tcHashOrNo: '45678901234',
    status: 'pending',
    createdAt: '2026-09-12T14:30:00Z',
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

  // 2.1 Cari, Şantiye, Makbuz & Fatura Hattı
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStored('bv_customers', INITIAL_CUSTOMERS)
  );
  const [sites, setSites] = useState<Site[]>(() =>
    loadStored('bv_sites', INITIAL_SITES)
  );
  const [jobReceipts, setJobReceipts] = useState<JobReceipt[]>(() =>
    loadStored('bv_job_receipts', INITIAL_JOB_RECEIPTS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadStored('bv_invoices', INITIAL_INVOICES)
  );
  const [collections, setCollections] = useState<Collection[]>(() =>
    loadStored('bv_collections', INITIAL_COLLECTIONS)
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    loadStored('bv_payments', INITIAL_PAYMENTS)
  );
  const [memberships, setMemberships] = useState<Membership[]>(() =>
    loadStored('bv_memberships', INITIAL_MEMBERSHIPS)
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

  // ==========================================
  // CARI (MÜŞTERİ) & ŞANTİYE YÖNETİMİ
  // ==========================================
  const addCustomer = async (custData: Omit<Customer, 'id' | 'createdAt'>) => {
    const id = generateUuid();
    const newCust: Customer = {
      ...custData,
      id,
      balance: custData.balance || 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => {
      const next = [newCust, ...prev];
      saveStored('bv_customers', next);
      return next;
    });
    logAction('CARI_EKLENDI', 'Cari', id, `${newCust.title} carisi sisteme eklendi.`);
    showToast(`✓ Cari Kart Oluşturuldu: ${newCust.title}`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('customers').insert([
          {
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
          },
        ]);
      } catch (err: any) {
        console.warn('Supabase customer insert notice:', err.message);
      }
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
      saveStored('bv_customers', next);
      return next;
    });
    showToast('Cari bilgileri güncellendi.');
  };

  const deleteCustomer = async (id: string) => {
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

  // ==========================================
  // MAKBUZ (İŞ MAKBUZLARI) -> FATURA HATTI
  // ==========================================
  const addJobReceipt = async (receiptData: Omit<JobReceipt, 'id' | 'createdAt' | 'receiptNo'>): Promise<JobReceipt> => {
    const id = generateUuid();
    const seq = String(jobReceipts.length + 1).padStart(4, '0');
    const receiptNo = `MB-2026-${seq}`;

    const newRec: JobReceipt = {
      ...receiptData,
      id,
      receiptNo,
      status: 'pending_approval',
      invoiced: false,
      createdAt: new Date().toISOString(),
    };

    setJobReceipts((prev) => {
      const next = [newRec, ...prev];
      saveStored('bv_job_receipts', next);
      return next;
    });

    // Otomatik onay talebi düşür
    await addApproval({
      kind: 'makbuz_onay',
      status: 'pending',
      title: `İş Makbuzu Onayı: ${receiptNo} (${newRec.customerName})`,
      personName: newRec.operatorName,
      amount: newRec.amount,
      note: `${newRec.workingHours} Saat | ${newRec.craneCode} | ${newRec.description}`,
      requestedDate: newRec.date,
    });

    logAction('MAKBUZ_OLUSTURULDU', 'Makbuz', id, `${receiptNo} no'lu makbuz operatörce düzenlendi.`);
    showToast(`✓ Makbuz Kesildi (${receiptNo}) - Yönetici Onayına Sunuldu`);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('job_receipts').insert([
          {
            id: newRec.id,
            receipt_no: newRec.receiptNo,
            customer_id: newRec.customerId,
            site_id: newRec.siteId,
            crane_code: newRec.craneCode,
            operator_id: newRec.operatorId,
            date: newRec.date,
            start_time: newRec.startTime,
            end_time: newRec.endTime,
            working_hours: newRec.workingHours,
            description: newRec.description,
            amount: newRec.amount,
            status: newRec.status,
            invoiced: false,
          },
        ]);
      } catch (err: any) {
        console.warn('Supabase job receipt insert error:', err.message);
      }
    }

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
    const seq = String(invoices.length + 1).padStart(4, '0');
    const invoiceNo = `FT-2026-${seq}`;

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

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('invoices').insert([
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
      } catch (err: any) {
        console.warn('Supabase invoice insert sync notice:', err.message);
      }
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
