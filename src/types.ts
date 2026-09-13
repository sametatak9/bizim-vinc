export type PersonKind = 'operator' | 'yardimci' | 'idari';
export type PersonStatus = 'aktif' | 'izinli' | 'pasif';
export type PoolStatus = 'gorevli' | 'musait' | 'havuzda';

export interface Person {
  id: string;
  employeeNo: string; // e.g. OP-204
  fullName: string;
  phone: string;
  kind: PersonKind;
  status: PersonStatus;
  poolStatus: PoolStatus;
  title: string;
  initials: string;
  cardSlug?: string;
  documentsOk: boolean;
  certExpiring: boolean;
  createdAt?: string;
}

export type CraneStatus = 'sahada' | 'musait' | 'bakimda' | 'arizali';

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
  createdAt?: string;
}

export type ApprovalKind =
  | 'yoklama'
  | 'mesai'
  | 'avans'
  | 'makbuz'
  | 'izin'
  | 'genel'
  | 'vinc_hareket'
  | 'mesai_kaldi';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  title: string;
  personName: string;
  personInitials?: string;
  relatedLabel?: string;
  note?: string;
  decisionNote?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  company: string;
  amount: number;
  status: 'kesildi' | 'birikti' | 'bekliyor';
  craneCode?: string;
  site?: string;
  daysPending?: number;
  createdAt: string;
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
  createdAt: string;
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
