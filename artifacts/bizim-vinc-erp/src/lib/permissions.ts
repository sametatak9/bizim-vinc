import { AppRole } from '../types';

/** Rol etiketleri — arayüzde kod yerine bu adlar gösterilir. */
export const ROLE_LABELS: Record<string, string> = {
  founder: 'Kurucu',
  admin: 'Sistem yöneticisi',
  yonetici: 'Yönetici',
  muhasebe: 'Muhasebe',
  puantor: 'Puantör',
  operasyon: 'Operasyon',
  operator: 'Operatör',
  personel: 'Personel',
  isyeri_hekimi: 'İşyeri hekimi',
  guest: 'Ziyaretçi',
};

export const roleLabel = (role?: string) => (role ? ROLE_LABELS[role] || role : 'Tanımsız');

/** Rol bazlı ekran erişimi. Yol bazlı tek doğruluk kaynağı. */
export const ROLE_ROUTES: Record<string, string[]> = {
  founder: ['*'],
  admin: ['*'],
  yonetici: ['/', '/faturalar', '/cariler', '/personel', '/puantaj', '/onay', '/filo', '/operator', '/finans', '/finans-planlama', '/teklifler', '/tv'],
  muhasebe: ['/', '/faturalar', '/cariler', '/finans', '/finans-planlama', '/teklifler', '/personel'],
  puantor: ['/', '/puantaj', '/personel', '/operator', '/onay'],
  operasyon: ['/', '/filo', '/faturalar', '/puantaj', '/operator', '/tv'],
  operator: ['/operator'],
  personel: ['/operator'],
  isyeri_hekimi: ['/personel'],
  guest: [],
};

/** Ödeme planı, dekont arşivi ve finansal raporlara erişebilen roller. */
export const FINANCE_ROLES: AppRole[] = ['founder', 'admin', 'yonetici', 'muhasebe'];
/** Personel kayıtlarını yönetebilen ofis rolleri. */
export const OFFICE_ROLES: AppRole[] = ['founder', 'admin', 'yonetici', 'muhasebe', 'puantor', 'operasyon'];
/** Üyelik başvurusu onaylayabilen roller. */
export const MEMBERSHIP_APPROVER_ROLES: AppRole[] = ['founder', 'admin'];
/** Onay taleplerine karar verebilen roller. */
export const APPROVER_ROLES: AppRole[] = ['founder', 'admin', 'yonetici'];

export const canAccessRoute = (role: string | undefined, path: string): boolean => {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some((item) => item === path || (path.startsWith(`${item}/`) && item !== '/'));
};

export const hasRole = (role: string | undefined, list: AppRole[]) => Boolean(role) && list.includes(role as AppRole);

/** Profil ekranında kullanıcıya gösterilecek yetki özeti. */
export const ROUTE_LABELS: Record<string, string> = {
  '/': 'Komuta merkezi',
  '/faturalar': 'Makbuz & fatura',
  '/cariler': 'Cari & şantiyeler',
  '/personel': 'Personel & maaş',
  '/puantaj': 'Puantaj',
  '/onay': 'Onay merkezi',
  '/filo': 'Filo',
  '/operator': 'Personel talepleri',
  '/finans': 'Finans',
  '/finans-planlama': 'Ödeme & tahsilat planlama',
  '/teklifler': 'Teklifler',
  '/admin': 'Yönetim',
  '/tv': 'Operasyon TV',
};

export const describeRoleAccess = (role?: string): string[] => {
  if (!role) return [];
  const allowed = ROLE_ROUTES[role] || [];
  if (allowed.includes('*')) return Object.values(ROUTE_LABELS);
  return allowed.map((path) => ROUTE_LABELS[path] || path);
};
