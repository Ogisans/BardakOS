import { formatTry, PRODUCT_NAME, UNIT_PRICE, colorLabel, colorById } from '../data.ts';
import type { OperationDetail } from '../features/management/recentOperations';
import type { Size } from '../types/operations';

// Fully fictional sample activity and chart baselines.
export const DEMO_SALES_BASELINE = { today: { count: 4, revenue: 1200 }, month: { count: 28, revenue: 8400 }, all: { count: 52, revenue: 15600 } };
export const DEMO_WEEKLY_SALES = [
  { day: 'Pzt', date: '1 Haz', count: 1, revenue: 300 },
  { day: 'Sal', date: '2 Haz', count: 2, revenue: 600 },
  { day: 'Çar', date: '3 Haz', count: 0, revenue: 0 },
  { day: 'Per', date: '4 Haz', count: 3, revenue: 900 },
  { day: 'Cum', date: '5 Haz', count: 2, revenue: 600 },
  { day: 'Cmt', date: '6 Haz', count: 4, revenue: 1200 },
];
export const DEMO_SIZE_SALES: Record<Size, number> = { S: 7, M: 18, L: 13, XL: 9, XXL: 5 };
export const DEMO_COLOR_SALES = { green: 28, white: 24 };
export const DEMO_RECENT_OPERATIONS: OperationDetail[] = [
  { id: 'mock-demo-sale-a', type: 'sale', title: 'Satış #1042', subtitle: `${colorLabel('green')} (M) · 1 Adet`, amount: '+' + formatTry(UNIT_PRICE), badge: 'Nakit', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', time: '14:20', dateStr: '14:20 · 7 Haziran 2026', methodLabel: 'Nakit', total: UNIT_PRICE, items: [{ name: PRODUCT_NAME, color: colorLabel('green'), colorHex: colorById('green').swatch, size: 'M', quantity: 1, price: UNIT_PRICE }] },
  { id: 'mock-demo-transfer', type: 'transfer', title: 'Stok transferi', subtitle: '3 Adet Araç → Tezgah', amount: '3 Adet', badge: 'Tamamlandı', badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400', time: '13:00', dateStr: '13:00 · 7 Haziran 2026', transferAction: 'completed', totalQty: 3, items: [{ name: PRODUCT_NAME, color: colorLabel('green'), colorHex: colorById('green').swatch, size: 'L', qty: 2 }, { name: PRODUCT_NAME, color: colorLabel('white'), colorHex: colorById('white').swatch, size: 'XL', qty: 1 }] },
  { id: 'mock-demo-sale-b', type: 'sale', title: 'Satış #1041', subtitle: `${colorLabel('white')} (L) · 1 Adet`, amount: '+' + formatTry(UNIT_PRICE), badge: 'Shopier', badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', time: '12:10', dateStr: '12:10 · 7 Haziran 2026', methodLabel: 'Online', total: UNIT_PRICE, items: [{ name: PRODUCT_NAME, color: colorLabel('white'), colorHex: colorById('white').swatch, size: 'L', quantity: 1, price: UNIT_PRICE }] },
  { id: 'mock-demo-sale-c', type: 'sale', title: 'Satış #1040', subtitle: `${colorLabel('green')} (XL) · 1 Adet`, amount: '+' + formatTry(UNIT_PRICE), badge: 'IBAN', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', time: '11:30', dateStr: '11:30 · 7 Haziran 2026', methodLabel: 'Havale', total: UNIT_PRICE, items: [{ name: PRODUCT_NAME, color: colorLabel('green'), colorHex: colorById('green').swatch, size: 'XL', quantity: 1, price: UNIT_PRICE }] },
];
