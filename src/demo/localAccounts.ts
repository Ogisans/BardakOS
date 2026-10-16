import type { LocalProfile } from '../types/localSession.ts';

/** Public test fixtures, not secrets or real identities. There is no remote authentication. */
export const LOCAL_TEST_ACCOUNTS: (LocalProfile & { password: string })[] = [
  { id: 'local-admin', email: 'yonetici@bardakos.example', password: 'Yonetim2026!', name: 'Deniz Kaya', role: 'admin', workNote: 'Koleksiyon ve stüdyo yönetimi.' },
  { id: 'local-field', email: 'saha@bardakos.example', password: 'Saha2026!', name: 'Ece Demir', role: 'field', workNote: 'Stand satışları ve stok takibi.' },
];
