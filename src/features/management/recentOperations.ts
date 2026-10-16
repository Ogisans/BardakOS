import { PRODUCT_NAME, formatTry, colorLabel, colorById, type SaleRecord, type TransferRecord } from '../../data.ts';
import { DEMO_RECENT_OPERATIONS } from '../../demo/dashboard.ts';

interface OperationItemDetail {
  name: string;
  color: string;
  colorHex: string;
  size: string;
  quantity?: number;
  qty?: number;
  price?: number;
}

export interface OperationDetail {
  id: string;
  type: 'sale' | 'transfer';
  timestamp?: number;
  title: string;
  subtitle: string;
  amount: string;
  badge: string;
  badgeColor: string;
  time: string;
  dateStr: string;
  methodLabel?: string;
  total?: number;
  items?: OperationItemDetail[];
  transferAction?: 'completed' | 'canceled';
  totalQty?: number;
}

export function getRecentOperations(salesHistory: SaleRecord[], transferHistory: TransferRecord[]): OperationDetail[] {
  const list: OperationDetail[] = [];

  // Add recent live sales
  salesHistory.forEach((s) => {
    const totalQty = s.items.reduce((acc, i) => acc + i.quantity, 0);
    const date = new Date(s.timestamp);
    list.push({
      id: s.id,
      timestamp: s.timestamp,
      type: 'sale',
      title: `Satış (#${s.id.slice(-4)})`,
      subtitle: `${totalQty} adet ${PRODUCT_NAME}`,
      amount: `+${formatTry(s.total)}`,
      badge: s.method === 'cash' ? 'Nakit' : s.method === 'shopier' ? 'Shopier' : 'IBAN',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      time: 'Az önce',
      dateStr: `${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      methodLabel: s.method === 'cash' ? 'Saha (Nakit)' : s.method === 'shopier' ? 'Online (Shopier)' : 'Havale (IBAN)',
      total: s.total,
      items: s.items.map((i) => ({
        name: PRODUCT_NAME,
        color: colorLabel(i.color),
        colorHex: colorById(i.color).swatch,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  });

  // Add recent live transfers
  transferHistory.forEach((t) => {
    const totalQty = t.items.reduce((acc, i) => acc + i.qty, 0);
    const date = new Date(t.timestamp);
    list.push({
      id: t.id,
      timestamp: t.timestamp,
      type: 'transfer',
      title: 'Stok Transferi',
      subtitle: `${totalQty} adet → ${t.action === 'completed' ? 'Tezgah' : 'Araca iade'}`,
      amount: `${totalQty} Adet`,
      badge: t.action === 'completed' ? 'Tamamlandı' : 'İptal',
      badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
      time: 'Az önce',
      dateStr: `${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      transferAction: t.action,
      totalQty,
      items: t.items.map((i) => ({
        name: PRODUCT_NAME,
        color: colorLabel(i.color),
        colorHex: colorById(i.color).swatch,
        size: i.size,
        qty: i.qty,
      })),
    });
  });

  list.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  list.splice(4);

  // Fill remaining slots with explicit historical demo operations
  if (list.length < 4) {
    list.push(...DEMO_RECENT_OPERATIONS.slice(0, 4 - list.length));
  }

  return list;
}
