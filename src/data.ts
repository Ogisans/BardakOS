import type { ColorId, ColorVariant, PaymentMethod, Size } from './types/operations.ts';

export type { Size, ColorId, PaymentMethod, ColorVariant, StockEntry, Transfer, CartItem, SaleRecord, TransferRecord } from './types/operations.ts';
export { INITIAL_STOCK, INITIAL_TRANSFERS } from './demo/field.ts';

export const PRODUCT_NAME = 'Basic Tişört';
export const UNIT_PRICE = 300; // Fictional demo price.

export const COLORS: ColorVariant[] = [
  { id: 'green', label: 'Adaçayı', swatch: '#91a58c' },
  { id: 'white', label: 'Kırık beyaz', swatch: '#f3f0e8' },
];

export const SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL'];

export const PAYMENT_LABELS: Record<PaymentMethod, { tr: string; sub: string }> = {
  cash: { tr: 'Saha (Nakit)', sub: 'Field · Cash' },
  shopier: { tr: 'Online (Shopier)', sub: 'Online · Shopier' },
  iban: { tr: 'Havale (IBAN)', sub: 'Transfer · IBAN' },
};

export const CRITICAL_THRESHOLD = 3;
export const WARNING_THRESHOLD = 6;

export const colorById = (id: ColorId): ColorVariant =>
  COLORS.find((c) => c.id === id)!;

export const colorLabel = (id: ColorId): string => colorById(id).label;

export const stockKey = (color: ColorId, size: Size): string => `${color}::${size}`;

export const formatTry = (n: number): string =>
  `${n.toLocaleString('tr-TR')} ₺`;
