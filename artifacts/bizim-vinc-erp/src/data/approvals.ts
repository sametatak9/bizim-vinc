export type ApprovalKind =
  | 'yoklama_geldi'
  | 'mesai_kaldi'
  | 'izin'
  | 'makbuz'
  | 'yakit_masraf'
  | 'vinc_hareket'
  | 'avans'
  | 'odeme'
  | 'tahsilat'
  | 'preuse_checklist'
  | 'diger';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ApprovalRequest {
  id: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  title: string;
  personName: string;
  personInitials: string;
  relatedLabel?: string;
  note?: string;
  createdAt: string;
  decidedAt?: string;
  decisionNote?: string;
}

export const APPROVALS_DEMO: ApprovalRequest[] = [
  {
    id: 'a-001',
    kind: 'mesai_kaldi',
    status: 'pending',
    title: 'Fazla mesai talebi',
    personName: 'Mehmet Kaya',
    personInitials: 'MK',
    relatedLabel: '3 saat · V-204',
    note: 'Saha gecikmesi nedeniyle ekstra süre',
    createdAt: '2026-09-12T08:15:00+03:00',
  },
  {
    id: 'a-002',
    kind: 'vinc_hareket',
    status: 'pending',
    title: 'Filo bakım talebi',
    personName: 'Elif Yılmaz',
    personInitials: 'EY',
    relatedLabel: 'Vinç V-302 · Hidrolik kontrol',
    createdAt: '2026-09-12T07:50:00+03:00',
  },
  {
    id: 'a-003',
    kind: 'diger',
    status: 'pending',
    title: 'Eksik evrak bildirimi',
    personName: 'Burak Şen',
    personInitials: 'BŞ',
    relatedLabel: 'SRC belgesi',
    note: 'Belge süresi dolmak üzere',
    createdAt: '2026-09-12T07:20:00+03:00',
  },
  {
    id: 'a-004',
    kind: 'yoklama_geldi',
    status: 'pending',
    title: 'Saha yoklama onayı',
    personName: 'Ali Demir',
    personInitials: 'AD',
    relatedLabel: 'V-118 · Bandırma',
    createdAt: '2026-09-12T08:05:00+03:00',
  },
  {
    id: 'a-005',
    kind: 'yakit_masraf',
    status: 'pending',
    title: 'Yakıt masrafı',
    personName: 'Can Özkan',
    personInitials: 'CÖ',
    relatedLabel: '2.450 ₺ · V-087',
    createdAt: '2026-09-12T06:40:00+03:00',
  },
  {
    id: 'a-006',
    kind: 'izin',
    status: 'approved',
    title: 'Yıllık izin talebi',
    personName: 'Zeynep Arslan',
    personInitials: 'ZA',
    relatedLabel: '3 gün · 15-17 Eyl',
    createdAt: '2026-09-11T14:20:00+03:00',
    decidedAt: '2026-09-11T16:05:00+03:00',
    decisionNote: 'Onaylandı',
  },
  {
    id: 'a-007',
    kind: 'makbuz',
    status: 'approved',
    title: 'İş makbuzu',
    personName: 'Mehmet Kaya',
    personInitials: 'MK',
    relatedLabel: 'MK-2026-0142 · Yapı Kredi',
    createdAt: '2026-09-11T11:30:00+03:00',
    decidedAt: '2026-09-11T12:10:00+03:00',
  },
  {
    id: 'a-008',
    kind: 'avans',
    status: 'rejected',
    title: 'Avans talebi',
    personName: 'Serkan Aydın',
    personInitials: 'SA',
    relatedLabel: '5.000 ₺',
    createdAt: '2026-09-10T09:15:00+03:00',
    decidedAt: '2026-09-10T11:00:00+03:00',
    decisionNote: 'Bu ay avans limiti dolu',
  },
  {
    id: 'a-009',
    kind: 'preuse_checklist',
    status: 'pending',
    title: 'Kullanım öncesi kontrol listesi',
    personName: 'Ali Demir',
    personInitials: 'AD',
    relatedLabel: 'V-118',
    createdAt: '2026-09-12T05:55:00+03:00',
  },
  {
    id: 'a-010',
    kind: 'tahsilat',
    status: 'approved',
    title: 'Tahsilat kaydı',
    personName: 'Hakan Çelik',
    personInitials: 'HÇ',
    relatedLabel: '18.500 ₺ · Kuzey Yapı',
    createdAt: '2026-09-11T17:40:00+03:00',
    decidedAt: '2026-09-11T17:55:00+03:00',
  },
];

export const kindLabel: Record<ApprovalKind, string> = {
  yoklama_geldi: 'Yoklama',
  mesai_kaldi: 'Mesai',
  izin: 'İzin',
  makbuz: 'Makbuz',
  yakit_masraf: 'Yakıt / Masraf',
  vinc_hareket: 'Vinç hareket',
  avans: 'Avans',
  odeme: 'Ödeme',
  tahsilat: 'Tahsilat',
  preuse_checklist: 'Ön kontrol',
  diger: 'Diğer',
};

export const statusLabel: Record<ApprovalStatus, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  cancelled: 'İptal',
};
