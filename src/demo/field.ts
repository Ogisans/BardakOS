import type { StockEntry, Transfer } from '../types/operations';

// Fictional inventory and pending transfers, unrelated to actual production.
export const INITIAL_STOCK: StockEntry[] = [
  { color: 'green', size: 'S', truck: 8, stand: 3 },
  { color: 'green', size: 'M', truck: 10, stand: 5 },
  { color: 'green', size: 'L', truck: 7, stand: 4 },
  { color: 'green', size: 'XL', truck: 4, stand: 2 },
  { color: 'green', size: 'XXL', truck: 1, stand: 1 },
  { color: 'white', size: 'S', truck: 6, stand: 2 },
  { color: 'white', size: 'M', truck: 8, stand: 4 },
  { color: 'white', size: 'L', truck: 5, stand: 3 },
  { color: 'white', size: 'XL', truck: 3, stand: 1 },
  { color: 'white', size: 'XXL', truck: 1, stand: 0 },
];
export const INITIAL_TRANSFERS: Transfer[] = [
  { id: 'demo-tr-a', batchId: 'demo-batch', color: 'green', size: 'L', qty: 2 },
  { id: 'demo-tr-b', batchId: 'demo-batch', color: 'white', size: 'XL', qty: 1 },
];
