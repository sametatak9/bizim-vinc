export type PersonnelKind = 'operator' | 'yardimci' | 'idari';
export type EmploymentStatus = 'aktif' | 'izinli' | 'pasif' | 'merged';
export type PoolStatus = 'havuzda' | 'gorevli' | 'izinli' | 'pasif';

export interface Personnel {
  id: string;
  employeeNo: string;
  fullName: string;
  phone?: string;
  kind: PersonnelKind;
  status: EmploymentStatus;
  poolStatus: PoolStatus;
  title?: string;
  photoUrl?: string;
  hiredAt?: string;
  initials: string;
  cardSlug?: string;
  documentsOk: boolean;
  certExpiring?: boolean;
}

export const PERSONNEL_DEMO: Personnel[] = [
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
    phone: '+90 533 444 55 66',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Teleskopik Vinç Operatörü',
    initials: 'AD',
    cardSlug: 'ali-demir',
    documentsOk: true,
    certExpiring: true,
  },
  {
    id: 'p-003',
    employeeNo: 'OP-302',
    fullName: 'Elif Yılmaz',
    phone: '+90 535 777 88 99',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Sepetli Platform Operatörü',
    initials: 'EY',
    cardSlug: 'elif-yilmaz',
    documentsOk: true,
  },
  {
    id: 'p-004',
    employeeNo: 'OP-087',
    fullName: 'Can Özkan',
    phone: '+90 536 123 45 67',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'gorevli',
    title: 'Mobil Vinç Operatörü',
    initials: 'CÖ',
    cardSlug: 'can-ozkan',
    documentsOk: false,
  },
  {
    id: 'p-005',
    employeeNo: 'YD-011',
    fullName: 'Burak Şen',
    phone: '+90 537 987 65 43',
    kind: 'yardimci',
    status: 'aktif',
    poolStatus: 'havuzda',
    title: 'Vinç Yardımcısı',
    initials: 'BŞ',
    cardSlug: 'burak-sen',
    documentsOk: false,
    certExpiring: true,
  },
  {
    id: 'p-006',
    employeeNo: 'YD-022',
    fullName: 'Zeynep Arslan',
    phone: '+90 538 111 00 22',
    kind: 'yardimci',
    status: 'izinli',
    poolStatus: 'izinli',
    title: 'Vinç Yardımcısı',
    initials: 'ZA',
    cardSlug: 'zeynep-arslan',
    documentsOk: true,
  },
  {
    id: 'p-007',
    employeeNo: 'ID-001',
    fullName: 'Esra Yıldırım',
    phone: '+90 212 555 01 01',
    kind: 'idari',
    status: 'aktif',
    poolStatus: 'havuzda',
    title: 'Operasyon Yöneticisi',
    initials: 'EY',
    cardSlug: 'esra-yildirim',
    documentsOk: true,
  },
  {
    id: 'p-008',
    employeeNo: 'ID-003',
    fullName: 'Hakan Çelik',
    phone: '+90 212 555 02 02',
    kind: 'idari',
    status: 'aktif',
    poolStatus: 'havuzda',
    title: 'Muhasebe Sorumlusu',
    initials: 'HÇ',
    cardSlug: 'hakan-celik',
    documentsOk: true,
  },
  {
    id: 'p-009',
    employeeNo: 'OP-155',
    fullName: 'Serkan Aydın',
    phone: '+90 539 222 33 44',
    kind: 'operator',
    status: 'aktif',
    poolStatus: 'havuzda',
    title: 'Mobil Vinç Operatörü',
    initials: 'SA',
    cardSlug: 'serkan-aydin',
    documentsOk: true,
  },
  {
    id: 'p-010',
    employeeNo: 'OP-210',
    fullName: 'Deniz Koç',
    phone: '+90 540 333 44 55',
    kind: 'operator',
    status: 'pasif',
    poolStatus: 'pasif',
    title: 'Teleskopik Vinç Operatörü',
    initials: 'DK',
    cardSlug: 'deniz-koc',
    documentsOk: true,
  },
];

export const kindLabel: Record<PersonnelKind, string> = {
  operator: 'Operatör',
  yardimci: 'Yardımcı',
  idari: 'İdari',
};

export const statusLabel: Record<EmploymentStatus, string> = {
  aktif: 'Aktif',
  izinli: 'İzinli',
  pasif: 'Pasif',
  merged: 'Birleştirildi',
};

export const poolLabel: Record<PoolStatus, string> = {
  havuzda: 'Havuzda',
  gorevli: 'Görevli',
  izinli: 'İzinli',
  pasif: 'Pasif',
};
