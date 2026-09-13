import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Person, Crane, Approval, Receipt, Expense, CraneStatus, ApprovalStatus, ApprovalKind } from '../types';
import { getSupabase, isSupabaseConfigured, generateUuid } from './supabase';

const INITIAL_PERSONNEL: Person[] = [
  {
    id: 'p-001',
    employeeNo: 'OP-204',
    fullName: 'Mehmet Kaya',
    phone: '+90 532 111 22 33',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Mobil Vinç Operatörü',
    initials: 'MK',
    cardSlug: 'mehmet-kaya',
    documentsOk: true,
    certExpiring: false,
  },
  {
    id: 'p-002',
    employeeNo: 'OP-118',
    fullName: 'Ali Demir',
    phone: '+90 533 222 33 44',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Teleskopik Vinç Operatörü',
    initials: 'AD',
    cardSlug: 'ali-demir',
    documentsOk: true,
    certExpiring: false,
  },
  {
    id: 'p-003',
    employeeNo: 'OP-302',
    fullName: 'Elif Yılmaz',
    phone: '+90 534 333 44 55',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'musait',
    title: 'Sepetli Platform Operatörü',
    initials: 'EY',
    cardSlug: 'elif-yilmaz',
    documentsOk: true,
    certExpiring: false,
  },
  {
    id: 'p-004',
    employeeNo: 'OP-087',
    fullName: 'Can Özkan',
    phone: '+90 535 444 55 66',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Paletli Vinç Operatörü',
    initials: 'CÖ',
    cardSlug: 'can-ozkan',
    documentsOk: false,
    certExpiring: true,
  },
  {
    id: 'p-005',
    employeeNo: 'YD-101',
    fullName: 'Ahmet Şahin',
    phone: '+90 536 555 66 77',
    kind: 'yardimci',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Vinç Yağcısı & Montör',
    initials: 'AŞ',
    cardSlug: 'ahmet-sahin',
    documentsOk: true,
    certExpiring: false,
  },
  {
    id: 'p-006',
    employeeNo: 'ID-001',
    fullName: 'Esra Yıldırım',
    phone: '+90 537 666 77 88',
    kind: 'idari',
    status: 'aktif',
    poolStatus: 'musait',
    title: 'Operasyon Yöneticisi',
    initials: 'EY',
    cardSlug: 'esra-yildirim',
    documentsOk: true,
    certExpiring: false,
  },
];

const INITIAL_CRANES: Crane[] = [
  {
    id: 'c-001',
    code: 'V-204',
    type: 'Mobil Vinç',
    status: 'sahada',
    capacity: '50 ton',
    operator: 'Mehmet Kaya',
    site: 'Ataşehir Metro Şantiyesi',
    lastService: '2026-08-12',
    lat: 40.9923,
    lng: 29.1244,
  },
  {
    id: 'c-002',
    code: 'V-118',
    type: 'Teleskopik',
    status: 'sahada',
    capacity: '80 ton',
    operator: 'Ali Demir',
    site: 'Bandırma Liman Projesi',
    lastService: '2026-07-28',
    lat: 40.3522,
    lng: 27.9767,
  },
  {
    id: 'c-003',
    code: 'V-302',
    type: 'Sepetli',
    status: 'musait',
    capacity: '35 metre',
    operator: 'Elif Yılmaz',
    site: 'Tuzla Ana Depo',
    lastService: '2026-08-30',
    lat: 40.865,
    lng: 29.301,
  },
  {
    id: 'c-004',
    code: 'V-087',
    type: 'Paletli Vinç',
    status: 'sahada',
    capacity: '120 ton',
    operator: 'Can Özkan',
    site: 'Aliağa Petrokimya',
    lastService: '2026-08-05',
    lat: 38.7985,
    lng: 26.968,
  },
  {
    id: 'c-005',
    code: 'V-155',
    type: 'Mobil Vinç',
    status: 'bakimda',
    capacity: '60 ton',
    operator: undefined,
    site: 'Merkez Servis İstasyonu',
    lastService: '2026-09-10',
    lat: 41.015,
    lng: 28.98,
  },
  {
    id: 'c-006',
    code: 'V-210',
    type: 'Hiyap Vinç',
    status: 'arizali',
    capacity: '25 ton',
    operator: undefined,
    site: 'Gebze Sanayi Sitesi',
    lastService: '2026-09-08',
    lat: 40.802,
    lng: 29.435,
  },
  {
    id: 'c-007',
    code: 'V-133',
    type: 'Mobil Vinç',
    status: 'sahada',
    capacity: '70 ton',
    operator: 'Serkan Aydın',
    site: 'Kadıköy Rıhtım İskelesi',
    lastService: '2026-08-18',
    lat: 40.99,
    lng: 29.025,
  },
  {
    id: 'c-008',
    code: 'V-198',
    type: 'Teleskopik',
    status: 'sahada',
    capacity: '100 ton',
    operator: 'Burak Yıldız',
    site: 'Maltepe Konut Şantiyesi',
    lastService: '2026-08-22',
    lat: 40.93,
    lng: 29.14,
  },
];

const INITIAL_APPROVALS: Approval[] = [
  {
    id: 'a-001',
    kind: 'mesai_kaldi',
    status: 'pending',
    title: 'Fazla mesai talebi',
    personName: 'Mehmet Kaya',
    personInitials: 'MK',
    relatedLabel: '3 saat · V-204',
    note: 'Saha gecikmesi nedeniyle ekstra süre',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'a-002',
    kind: 'vinc_hareket',
    status: 'pending',
    title: 'Filo bakım talebi',
    personName: 'Bakım Şefi',
    personInitials: 'BŞ',
    relatedLabel: 'V-155 Hidrolik değişimi',
    note: '250 saatlik periyodik keçe revizyonu',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'a-003',
    kind: 'yoklama',
    status: 'approved',
    title: 'İşe geldim (Saha Yoklaması)',
    personName: 'Ali Demir',
    personInitials: 'AD',
    relatedLabel: 'V-118 · Bandırma Limanı',
    note: 'Saha kontrolü tamamlandı.',
    decidedAt: new Date(Date.now() - 14400000).toISOString(),
    decisionNote: 'Onaylandı',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'r-001',
    receiptNo: 'MK-2026-0148',
    company: 'Yapı Kredi Genel Müd.',
    amount: 42000,
    status: 'kesildi',
    craneCode: 'V-204',
    site: 'Ataşehir',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r-002',
    receiptNo: 'MK-2026-0147',
    company: 'Kuzey Yapı İnşaat A.Ş.',
    amount: 18500,
    status: 'kesildi',
    craneCode: 'V-118',
    site: 'Bandırma',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r-003',
    receiptNo: 'MK-2026-0146',
    company: 'Ege Liman İşletmeleri',
    amount: 27200,
    status: 'kesildi',
    craneCode: 'V-087',
    site: 'Aliağa',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r-004',
    receiptNo: 'MK-2026-0145',
    company: 'Marmara Rüzgar Enerji',
    amount: 31000,
    status: 'kesildi',
    craneCode: 'V-133',
    site: 'Kadıköy',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r-005',
    receiptNo: 'BK-2026-0041',
    company: 'Doğu Çelik Konstrüksiyon',
    amount: 28000,
    status: 'birikti',
    craneCode: 'V-204',
    site: 'Ataşehir',
    daysPending: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r-006',
    receiptNo: 'BK-2026-0042',
    company: 'Bandırma Gübre Sanayi',
    amount: 16500,
    status: 'birikti',
    craneCode: 'V-118',
    site: 'Bandırma',
    daysPending: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r-007',
    receiptNo: 'BK-2026-0043',
    company: 'Tüpraş Rafineri Bakım',
    amount: 39000,
    status: 'birikti',
    craneCode: 'V-087',
    site: 'Aliağa',
    daysPending: 5,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e-001',
    category: 'yakit',
    title: 'Dizel Yakıt Dolumu',
    detail: 'Shell Ataşehir · Mehmet Kaya',
    amount: 2450,
    craneCode: 'V-204',
    personName: 'Mehmet Kaya',
    stationOrSupplier: 'Shell Ataşehir',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e-002',
    category: 'yakit',
    title: 'Dizel Yakıt Dolumu',
    detail: 'Opet Aliağa · Can Özkan',
    amount: 3120,
    craneCode: 'V-087',
    personName: 'Can Özkan',
    stationOrSupplier: 'Opet Aliağa',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e-003',
    category: 'masraf',
    title: 'Hidrolik hortum değişimi',
    detail: 'V-155 · Parça değişimi',
    amount: 1250,
    craneCode: 'V-155',
    stationOrSupplier: 'Teknik Servis',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e-004',
    category: 'masraf',
    title: 'Yağ değişimi ve filtre',
    detail: 'V-210 · Periyodik bakım',
    amount: 980,
    craneCode: 'V-210',
    stationOrSupplier: 'Mobil Yağ',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e-005',
    category: 'masraf',
    title: 'Otoyol HGS Geçişi',
    detail: 'V-204 · Kuzey Marmara Otoyolu',
    amount: 245,
    craneCode: 'V-204',
    stationOrSupplier: 'KGM HGS',
    createdAt: new Date().toISOString(),
  },
];

interface ERPContextType {
  personnel: Person[];
  cranes: Crane[];
  approvals: Approval[];
  receipts: Receipt[];
  expenses: Expense[];
  stats: {
    todayRevenue: number;
    cutReceiptsCount: number;
    pendingReceiptsCount: number;
    todayFuel: number;
    todayExpenses: number;
    activeCranesCount: number;
    totalCranesCount: number;
    pendingApprovalsCount: number;
  };
  isSupabaseOnline: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Person actions
  addPerson: (person: Omit<Person, 'id' | 'initials' | 'cardSlug'>) => void;
  updatePerson: (id: string, person: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  // Crane actions
  addCrane: (crane: Omit<Crane, 'id'>) => void;
  updateCrane: (id: string, crane: Partial<Crane>) => void;
  updateCraneStatus: (id: string, status: CraneStatus, operator?: string, site?: string) => void;
  deleteCrane: (id: string) => void;
  // Approval actions
  createApprovalRequest: (
    kind: ApprovalKind,
    title: string,
    detail: string,
    operatorName?: string,
    operatorInitials?: string
  ) => void;
  handleApprovalDecision: (id: string, status: ApprovalStatus, note?: string) => void;
  // Receipt actions
  addReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => void;
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  // Active operator info
  currentOperator: Person;
  setCurrentOperatorId: (id: string) => void;
}

const ERPContext = createContext<ERPContextType | null>(null);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personnel, setPersonnel] = useState<Person[]>(() => {
    const saved = localStorage.getItem('bv_personnel');
    return saved ? JSON.parse(saved) : INITIAL_PERSONNEL;
  });

  const [cranes, setCranes] = useState<Crane[]>(() => {
    const saved = localStorage.getItem('bv_cranes');
    return saved ? JSON.parse(saved) : INITIAL_CRANES;
  });

  const [approvals, setApprovals] = useState<Approval[]>(() => {
    const saved = localStorage.getItem('bv_approvals');
    return saved ? JSON.parse(saved) : INITIAL_APPROVALS;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('bv_receipts');
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('bv_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [currentOperatorId, setCurrentOperatorId] = useState<string>('p-001');
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('bv_personnel', JSON.stringify(personnel));
  }, [personnel]);

  useEffect(() => {
    localStorage.setItem('bv_cranes', JSON.stringify(cranes));
  }, [cranes]);

  useEffect(() => {
    localStorage.setItem('bv_approvals', JSON.stringify(approvals));
  }, [approvals]);

  useEffect(() => {
    localStorage.setItem('bv_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('bv_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Check and sync with Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseOnline(false);
      return;
    }

    const sb = getSupabase();
    if (!sb) return;

    let isMounted = true;

    async function loadFromSupabase() {
      try {
        const [pRes, cRes, aRes, rRes, eRes] = await Promise.allSettled([
          sb.from('personnel').select('*'),
          sb.from('cranes').select('*'),
          sb.from('approvals').select('*').order('created_at', { ascending: false }),
          sb.from('receipts').select('*'),
          sb.from('expenses').select('*'),
        ]);

        if (!isMounted) return;

        let anySuccess = false;

        // Personnel sync
        if (pRes.status === 'fulfilled' && !pRes.value.error) {
          anySuccess = true;
          if (pRes.value.data && pRes.value.data.length > 0) {
            setPersonnel(
              pRes.value.data.map((row: any) => ({
                id: row.id,
                employeeNo: row.employee_no,
                fullName: row.full_name,
                phone: row.phone,
                kind: row.kind,
                status: row.status,
                poolStatus: row.pool_status,
                title: row.title,
                initials: row.initials,
                cardSlug: row.card_slug,
                documentsOk: row.documents_ok,
                certExpiring: row.cert_expiring,
                createdAt: row.created_at,
              }))
            );
          } else {
            // Seed initial personnel to Supabase
            const seedPayload = INITIAL_PERSONNEL.map((p) => ({
              employee_no: p.employeeNo,
              full_name: p.fullName,
              phone: p.phone,
              kind: p.kind,
              status: p.status,
              pool_status: p.poolStatus,
              title: p.title,
              initials: p.initials,
              card_slug: p.cardSlug,
              documents_ok: p.documentsOk,
              cert_expiring: p.certExpiring,
            }));
            sb.from('personnel').insert(seedPayload).then();
          }
        }

        // Cranes sync
        if (cRes.status === 'fulfilled' && !cRes.value.error) {
          anySuccess = true;
          if (cRes.value.data && cRes.value.data.length > 0) {
            setCranes(
              cRes.value.data.map((row: any) => ({
                id: row.id,
                code: row.code,
                type: row.type,
                status: row.status,
                capacity: row.capacity,
                operator: row.operator,
                site: row.site,
                lastService: row.last_service,
                lat: row.lat,
                lng: row.lng,
                createdAt: row.created_at,
              }))
            );
          } else {
            // Seed initial cranes to Supabase
            const seedPayload = INITIAL_CRANES.map((c) => ({
              code: c.code,
              type: c.type,
              status: c.status,
              capacity: c.capacity,
              operator: c.operator,
              site: c.site,
              last_service: c.lastService,
              lat: c.lat,
              lng: c.lng,
            }));
            sb.from('cranes').insert(seedPayload).then();
          }
        }

        // Approvals sync
        if (aRes.status === 'fulfilled' && !aRes.value.error && aRes.value.data && aRes.value.data.length > 0) {
          anySuccess = true;
          setApprovals(
            aRes.value.data.map((row: any) => ({
              id: row.id,
              kind: row.kind,
              status: row.status,
              title: row.title,
              personName: row.person_name,
              personInitials: row.person_initials,
              relatedLabel: row.related_label,
              note: row.note,
              decisionNote: row.decision_note,
              decidedAt: row.decided_at,
              createdAt: row.created_at,
            }))
          );
        }

        // Receipts sync
        if (rRes.status === 'fulfilled' && !rRes.value.error && rRes.value.data && rRes.value.data.length > 0) {
          anySuccess = true;
          setReceipts(
            rRes.value.data.map((row: any) => ({
              id: row.id,
              receiptNo: row.receipt_no,
              company: row.company,
              amount: Number(row.amount),
              status: row.status,
              craneCode: row.crane_code,
              site: row.site,
              daysPending: row.days_pending,
              createdAt: row.created_at,
            }))
          );
        }

        // Expenses sync
        if (eRes.status === 'fulfilled' && !eRes.value.error && eRes.value.data && eRes.value.data.length > 0) {
          anySuccess = true;
          setExpenses(
            eRes.value.data.map((row: any) => ({
              id: row.id,
              category: row.category,
              title: row.title,
              detail: row.detail,
              amount: Number(row.amount),
              craneCode: row.crane_code,
              personName: row.person_name,
              stationOrSupplier: row.station_or_supplier,
              createdAt: row.created_at,
            }))
          );
        }

        setIsSupabaseOnline(anySuccess);
      } catch {
        if (isMounted) setIsSupabaseOnline(false);
      }
    }

    loadFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Personnel actions
  const addPerson = (data: Omit<Person, 'id' | 'initials' | 'cardSlug'>) => {
    const initials = data.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const cardSlug = data.fullName.toLowerCase().replace(/\s+/g, '-');
    const newPerson: Person = {
      ...data,
      id: generateUuid(),
      initials,
      cardSlug,
      createdAt: new Date().toISOString(),
    };

    setPersonnel((prev) => [newPerson, ...prev]);
    showToast(`${newPerson.fullName} sisteme eklendi.`);

    // Supabase async sync
    const sb = getSupabase();
    if (sb) {
      sb.from('personnel')
        .insert({
          id: newPerson.id,
          employee_no: newPerson.employeeNo,
          full_name: newPerson.fullName,
          phone: newPerson.phone,
          kind: newPerson.kind,
          status: newPerson.status,
          pool_status: newPerson.poolStatus,
          title: newPerson.title,
          initials: newPerson.initials,
          card_slug: newPerson.cardSlug,
          documents_ok: newPerson.documentsOk,
          cert_expiring: newPerson.certExpiring,
        })
        .then();
    }
  };

  const updatePerson = (id: string, data: Partial<Person>) => {
    setPersonnel((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...data };
          if (data.fullName) {
            updated.initials = data.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            updated.cardSlug = data.fullName.toLowerCase().replace(/\s+/g, '-');
          }
          return updated;
        }
        return p;
      })
    );
    showToast('Personel bilgileri güncellendi.');

    const sb = getSupabase();
    if (sb) {
      const payload: any = {};
      if (data.fullName) payload.full_name = data.fullName;
      if (data.employeeNo) payload.employee_no = data.employeeNo;
      if (data.phone) payload.phone = data.phone;
      if (data.kind) payload.kind = data.kind;
      if (data.status) payload.status = data.status;
      if (data.poolStatus) payload.pool_status = data.poolStatus;
      if (data.title) payload.title = data.title;
      if (data.documentsOk !== undefined) payload.documents_ok = data.documentsOk;
      if (data.certExpiring !== undefined) payload.cert_expiring = data.certExpiring;

      sb.from('personnel').update(payload).eq('id', id).then();
    }
  };

  const deletePerson = (id: string) => {
    const person = personnel.find((p) => p.id === id);
    setPersonnel((prev) => prev.filter((p) => p.id !== id));
    showToast(`${person?.fullName || 'Personel'} silindi.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('personnel').delete().eq('id', id).then();
    }
  };

  // Crane actions
  const addCrane = (data: Omit<Crane, 'id'>) => {
    const newCrane: Crane = {
      ...data,
      id: generateUuid(),
      createdAt: new Date().toISOString(),
    };
    setCranes((prev) => [newCrane, ...prev]);
    showToast(`${newCrane.code} vinci filoya eklendi.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('cranes')
        .insert({
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
        })
        .then();
    }
  };

  const updateCrane = (id: string, data: Partial<Crane>) => {
    setCranes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    showToast('Vinç bilgileri güncellendi.');

    const sb = getSupabase();
    if (sb) {
      sb.from('cranes').update(data).eq('id', id).then();
    }
  };

  const updateCraneStatus = (
    id: string,
    status: CraneStatus,
    operator?: string,
    site?: string
  ) => {
    setCranes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, operator: operator ?? c.operator, site: site ?? c.site } : c))
    );
    showToast(`Vinç durumu "${status}" olarak güncellendi.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('cranes')
        .update({ status, operator, site })
        .eq('id', id)
        .then();
    }
  };

  const deleteCrane = (id: string) => {
    const cr = cranes.find((c) => c.id === id);
    setCranes((prev) => prev.filter((c) => c.id !== id));
    showToast(`${cr?.code || 'Vinç'} filodan kaldırıldı.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('cranes').delete().eq('id', id).then();
    }
  };

  // Approval actions (Operatör talepleri & Yönetici kararları)
  const createApprovalRequest = (
    kind: ApprovalKind,
    title: string,
    detail: string,
    operatorName?: string,
    operatorInitials?: string
  ) => {
    const op = personnel.find((p) => p.id === currentOperatorId) || personnel[0];
    const opName = operatorName || op.fullName;
    const opInitials = operatorInitials || op.initials;

    const newApproval: Approval = {
      id: generateUuid(),
      kind,
      status: 'pending',
      title,
      personName: opName,
      personInitials: opInitials,
      relatedLabel: detail,
      note: detail,
      createdAt: new Date().toISOString(),
    };

    setApprovals((prev) => [newApproval, ...prev]);
    showToast(`"${title}" talebi oluşturuldu ve Onay Merkezi'ne iletildi.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('approvals')
        .insert({
          id: newApproval.id,
          kind: newApproval.kind,
          status: newApproval.status,
          title: newApproval.title,
          person_name: newApproval.personName,
          person_initials: newApproval.personInitials,
          related_label: newApproval.relatedLabel,
          note: newApproval.note,
        })
        .then();
    }
  };

  const handleApprovalDecision = (id: string, status: ApprovalStatus, note?: string) => {
    const decidedAt = new Date().toISOString();
    const decisionNote = note || (status === 'approved' ? 'Onaylandı' : 'Reddedildi');

    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, decidedAt, decisionNote } : a))
    );

    showToast(status === 'approved' ? 'Talep onaylandı.' : 'Talep reddedildi.');

    const sb = getSupabase();
    if (sb) {
      sb.from('approvals')
        .update({
          status,
          decided_at: decidedAt,
          decision_note: decisionNote,
        })
        .eq('id', id)
        .then();
    }
  };

  // Receipt & Expense actions
  const addReceipt = (data: Omit<Receipt, 'id' | 'createdAt'>) => {
    const newRec: Receipt = {
      ...data,
      id: generateUuid(),
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [newRec, ...prev]);
    showToast(`${newRec.receiptNo} makbuzu kaydedildi.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('receipts')
        .insert({
          id: newRec.id,
          receipt_no: newRec.receiptNo,
          company: newRec.company,
          amount: newRec.amount,
          status: newRec.status,
          crane_code: newRec.craneCode,
          site: newRec.site,
          days_pending: newRec.daysPending || 0,
        })
        .then();
    }
  };

  const addExpense = (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...data,
      id: generateUuid(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    showToast(`${newExp.title} masrafı işlendi.`);

    const sb = getSupabase();
    if (sb) {
      sb.from('expenses')
        .insert({
          id: newExp.id,
          category: newExp.category,
          title: newExp.title,
          detail: newExp.detail,
          amount: newExp.amount,
          crane_code: newExp.craneCode,
          person_name: newExp.personName,
          station_or_supplier: newExp.stationOrSupplier,
        })
        .then();
    }
  };

  // Dynamic KPI stats
  const stats = useMemo(() => {
    const todayRevenue = receipts
      .filter((r) => r.status === 'kesildi')
      .reduce((sum, r) => sum + r.amount, 0);

    const cutReceiptsCount = receipts.filter((r) => r.status === 'kesildi').length;
    const pendingReceiptsCount = receipts.filter((r) => r.status === 'birikti').length;

    const todayFuel = expenses
      .filter((e) => e.category === 'yakit')
      .reduce((sum, e) => sum + e.amount, 0);

    const todayExpenses = expenses
      .filter((e) => e.category === 'masraf')
      .reduce((sum, e) => sum + e.amount, 0);

    const activeCranesCount = cranes.filter((c) => c.status === 'sahada').length;
    const totalCranesCount = cranes.length;

    const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

    return {
      todayRevenue,
      cutReceiptsCount,
      pendingReceiptsCount,
      todayFuel,
      todayExpenses,
      activeCranesCount,
      totalCranesCount,
      pendingApprovalsCount,
    };
  }, [receipts, expenses, cranes, approvals]);

  const currentOperator = useMemo(() => {
    return personnel.find((p) => p.id === currentOperatorId) || personnel[0];
  }, [personnel, currentOperatorId]);

  return (
    <ERPContext.Provider
      value={{
        personnel,
        cranes,
        approvals,
        receipts,
        expenses,
        stats,
        isSupabaseOnline,
        toastMessage,
        showToast,
        addPerson,
        updatePerson,
        deletePerson,
        addCrane,
        updateCrane,
        updateCraneStatus,
        deleteCrane,
        createApprovalRequest,
        handleApprovalDecision,
        addReceipt,
        addExpense,
        currentOperator,
        setCurrentOperatorId,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
