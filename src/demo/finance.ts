import type { ExpenseItem } from '../types/management';

// Fictional values, dates and descriptions; not a company ledger.
export const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'demo-exp-a', title: 'Kumaş alımı', category: 'Hammadde', amount: 1800, date: '4 Haz 2026', channel: 'Banka Transferi' },
  { id: 'demo-exp-b', title: 'Numune dikimi', category: 'İşçilik', amount: 1200, date: '8 Haz 2026', channel: 'Banka Transferi' },
  { id: 'demo-exp-c', title: 'Paket gönderimi', category: 'Lojistik', amount: 450, date: '12 Haz 2026', channel: 'Kredi Kartı' },
  { id: 'demo-exp-d', title: 'Stand alanı kurulumu', category: 'İşletme', amount: 750, date: '16 Haz 2026', channel: 'Nakit' },
  { id: 'demo-exp-e', title: 'Etiket tasarımı', category: 'Pazarlama', amount: 300, date: '20 Haz 2026', channel: 'Kredi Kartı' },
];
export const DEMO_CHANNEL_REVENUE = { cash: 7200, shopier: 4800, iban: 3600 };
export const DEMO_CHANNEL_COUNTS = { cash: 24, shopier: 16, iban: 12 };
export const DEMO_STARTING_CASH = 600;
export const DEMO_MONTHLY_FLOW = [
  { month: 'Ocak', income: 2400, expense: 1800 },
  { month: 'Şubat', income: 3600, expense: 2700 },
  { month: 'Mart', income: 4800, expense: 3300 },
  { month: 'Nisan', income: 7200, expense: 3900 },
  { month: 'Mayıs', income: 9600, expense: 4200 },
];
