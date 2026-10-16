export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type ColorId = 'green' | 'white';
export type PaymentMethod = 'cash' | 'shopier' | 'iban';

export interface ColorVariant {
  id: ColorId;
  label: string;
  swatch: string;
}

export interface StockEntry {
  color: ColorId;
  size: Size;
  truck: number;
  stand: number;
}

export interface Transfer {
  id: string;
  batchId: string;
  color: ColorId;
  size: Size;
  qty: number;
}

export interface CartItem {
  id: string;
  color: ColorId;
  size: Size;
  quantity: number;
  price: number;
}

export interface SaleRecord {
  id: string;
  timestamp: number;
  items: CartItem[];
  method: PaymentMethod;
  total: number;
}

export interface TransferRecord {
  id: string;
  batchId: string;
  timestamp: number;
  items: { color: ColorId; size: Size; qty: number }[];
  action: 'completed' | 'canceled';
}
