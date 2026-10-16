import type { CollectionContent, CollectionEntryInput } from '../types/collectionContent.ts';
import { isLocalDate } from './dates.ts';
import { parseMoneyAmount } from './money.ts';

export const emptyCollectionContent = (): CollectionContent => ({ entries: [], files: [] });
export class ContentValidationError extends Error {
  readonly fields: Record<string, string>;
  constructor(fields: Record<string, string>) { super('Alanları kontrol edin.'); this.fields = fields; this.name = 'ContentValidationError'; }
}

export function normalizeContentEntry(input: CollectionEntryInput): CollectionEntryInput {
  const errors: Record<string, string> = {};
  if (!input.title.trim() || input.title.trim().length > 120) errors.title = '1–120 karakterlik bir başlık girin.';
  if (input.notes.length > 2000) errors.notes = 'Notlar en fazla 2.000 karakter olabilir.';
  if (!['product', 'production', 'campaign'].includes(input.kind)) errors.kind = 'Geçerli bir bölüm seçin.';
  if (!['planned', 'in_progress', 'completed'].includes(input.status)) errors.status = 'Geçerli bir durum seçin.';
  if (input.date !== null && !isLocalDate(input.date)) errors.date = 'Geçerli bir tarih seçin.';
  if (input.kind === 'product') {
    if (input.sku.length > 60) errors.sku = 'Ürün kodu en fazla 60 karakter olabilir.';
    if (input.quantity !== null && (!Number.isSafeInteger(input.quantity) || input.quantity < 0)) errors.quantity = 'Sıfır veya pozitif bir tam sayı girin.';
    if (input.unitPrice !== null && parseMoneyAmount(String(input.unitPrice), true) === null) errors.unitPrice = 'Sıfır veya pozitif, en fazla iki ondalıklı tutar girin.';
  }
  if (Object.keys(errors).length) throw new ContentValidationError(errors);
  const base = { title: input.title.trim(), notes: input.notes.trim(), date: input.date, status: input.status };
  return input.kind === 'product' ? { ...base, kind: 'product', sku: input.sku.trim(), quantity: input.quantity, unitPrice: input.unitPrice } : { ...base, kind: input.kind };
}
