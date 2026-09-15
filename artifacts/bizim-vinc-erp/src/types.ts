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
