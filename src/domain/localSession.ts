import { LOCAL_TEST_ACCOUNTS } from '../demo/localAccounts.ts';
import type { LocalProfile, LocalRole, ProfileInput } from '../types/localSession.ts';

/** Local UI preview only. Client-side checks do not provide server authorization. */
export function signInLocally(email: string, password: string): LocalProfile | null {
  const account = LOCAL_TEST_ACCOUNTS.find(item => item.email === email.trim().toLocaleLowerCase('en-US') && item.password === password);
  if (!account) return null;
  return { id: account.id, email: account.email, name: account.name, role: account.role, workNote: account.workNote };
}
export const canUseManagement = (role: LocalRole) => role === 'admin';
export const canAccessMode = (role: LocalRole, mode: 'management' | 'field') => ['admin', 'field'].includes(role) && (mode === 'field' || (mode === 'management' && canUseManagement(role)));
export const initialLocalMode = (role: LocalRole, wide: boolean) => canUseManagement(role) && wide ? 'management' as const : 'field' as const;
export const ROLE_LABEL = { admin: 'Yönetici', field: 'Saha çalışanı' };
export const WORK_AREA = { admin: 'Stüdyo yönetimi · Yönetim ve saha', field: 'Saha operasyonu · Stand ve depo' };
export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2) ?? '').toLocaleUpperCase('tr-TR');
}
export class ProfileValidationError extends Error {
  readonly fields: Partial<Record<keyof ProfileInput, string>>;
  constructor(fields: Partial<Record<keyof ProfileInput, string>>) { super('Profil alanlarını kontrol edin.'); this.fields = fields; }
}
export function editLocalProfile(profile: LocalProfile, input: ProfileInput): LocalProfile {
  const fields: Partial<Record<keyof ProfileInput, string>> = {};
  if (!input.name.trim() || input.name.trim().length > 80) fields.name = '1–80 karakterlik bir ad girin.';
  if (input.workNote.trim().length > 160) fields.workNote = 'Çalışma notu en fazla 160 karakter olabilir.';
  if (Object.keys(fields).length) throw new ProfileValidationError(fields);
  // Explicit allowlist: role, email and ID cannot be changed via profile editing.
  return { ...profile, name: input.name.trim(), workNote: input.workNote.trim() };
}
