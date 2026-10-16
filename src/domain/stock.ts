import type { CartItem, StockEntry, Transfer } from '../types/operations';

type StockChange = Pick<StockEntry, 'color' | 'size'> & { quantity: number };

function adjustStock(
  stock: StockEntry[],
  changes: StockChange[],
  location: 'truck' | 'stand',
  direction: 1 | -1,
): StockEntry[] {
  return stock.map((entry) => {
    const quantity = changes
      .filter((item) => item.color === entry.color && item.size === entry.size)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (quantity <= 0) return entry;

    // Preserve the existing demo clamp. Server-side stock validation belongs to the data phase.
    return { ...entry, [location]: Math.max(0, entry[location] + direction * quantity) };
  });
}

export function applySaleToStock(stock: StockEntry[], items: CartItem[], restore = false): StockEntry[] {
  return adjustStock(stock, items, 'stand', restore ? 1 : -1);
}

export function applyTransferToStock(
  stock: StockEntry[],
  transfers: Transfer[],
  action: 'create' | 'complete' | 'cancel',
): StockEntry[] {
  const changes = transfers.map(({ color, size, qty }) => ({ color, size, quantity: qty }));
  return adjustStock(stock, changes, action === 'complete' ? 'stand' : 'truck', action === 'create' ? -1 : 1);
}
