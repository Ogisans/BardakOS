export type LocalRole = 'admin' | 'field';
export interface LocalProfile {
  id: string;
  email: string;
  name: string;
  role: LocalRole;
  workNote: string;
}
export interface ProfileInput { name: string; workNote: string }
