import type { Collection, CollectionErrors, CollectionFormValues, CollectionInput } from '../types/collections.ts';
import { parseMoneyAmount } from './money.ts';
import { isLocalDate } from './dates.ts';

export const COLLECTION_STATUSES = ['planning', 'sampling', 'production', 'on_sale', 'archived'] as const;
export const FINANCE_QUALITIES = ['unverified', 'approximate', 'confirmed'] as const;
export const QUANTITY_FIELDS = ['productionTarget', 'producedQuantity', 'salesTarget', 'soldQuantity'] as const;
export const MONEY_FIELDS = ['plannedBudget', 'actualRevenue', 'actualExpense'] as const;

export function validateCollection(input: CollectionInput): CollectionErrors {
  const errors: CollectionErrors = {};
  if (!input.name.trim() || input.name.trim().length > 100) errors.name = '1–100 karakterlik bir koleksiyon adı girin.';
  if (input.description.length > 600) errors.description = 'Açıklama en fazla 600 karakter olabilir.';
  if (input.notes.length > 2000) errors.notes = 'Notlar en fazla 2.000 karakter olabilir.';
  if (!COLLECTION_STATUSES.includes(input.status)) errors.status = 'Geçerli bir süreç durumu seçin.';
  if (!FINANCE_QUALITIES.includes(input.financeQuality)) errors.financeQuality = 'Finansal verinin niteliğini seçin.';
  for (const field of QUANTITY_FIELDS) {
    const value = input[field];
    if (value !== null && (!Number.isSafeInteger(value) || value < 0)) errors[field] = 'Sıfır veya pozitif bir tam sayı girin; bilinmiyorsa boş bırakın.';
  }
  for (const field of MONEY_FIELDS) {
    const value = input[field];
    if (value !== null && (typeof value !== 'number' || parseMoneyAmount(String(value), true) === null)) {
      errors[field] = 'Sıfır veya pozitif, en fazla iki ondalıklı bir tutar girin.';
    }
  }
  for (const field of ['startDate', 'targetDate'] as const) {
    if (input[field] !== null && !isLocalDate(input[field])) errors[field] = 'Geçerli bir tarih seçin.';
  }
  if (!errors.startDate && !errors.targetDate && input.startDate && input.targetDate && input.targetDate < input.startDate) {
    errors.targetDate = 'Hedef tarih başlangıçtan önce olamaz.';
  }
  if (!errors.soldQuantity && !errors.producedQuantity && input.soldQuantity !== null && input.producedQuantity !== null && input.soldQuantity > input.producedQuantity) {
    errors.soldQuantity = 'Gerçekleşen satış adedi üretilen adedi aşamaz.';
  }
  return errors;
}

export class CollectionValidationError extends Error {
  readonly fields: CollectionErrors;
  constructor(fields: CollectionErrors) {
    super('Koleksiyon alanlarını kontrol edin.');
    this.name = 'CollectionValidationError';
    this.fields = fields;
  }
}

export function normalizeCollection(input: CollectionInput): CollectionInput {
  const errors = validateCollection(input);
  if (Object.keys(errors).length) throw new CollectionValidationError(errors);
  return { ...input, name: input.name.trim(), description: input.description.trim(), notes: input.notes.trim() };
}

export function collectionFormValues(input?: CollectionInput): CollectionFormValues {
  return {
    name: input?.name ?? '', description: input?.description ?? '', status: input?.status ?? 'planning',
    startDate: input?.startDate ?? '', targetDate: input?.targetDate ?? '', notes: input?.notes ?? '',
    productionTarget: String(input?.productionTarget ?? ''), producedQuantity: String(input?.producedQuantity ?? ''),
    salesTarget: String(input?.salesTarget ?? ''), soldQuantity: String(input?.soldQuantity ?? ''),
    plannedBudget: String(input?.plannedBudget ?? ''), actualRevenue: String(input?.actualRevenue ?? ''),
    actualExpense: String(input?.actualExpense ?? ''), financeQuality: input?.financeQuality ?? 'unverified',
  };
}

export function parseCollectionForm(values: CollectionFormValues): CollectionInput {
  const count = (value: string) => value.trim() === '' ? null : Number(value);
  const money = (value: string) => value.trim() === '' ? null : (parseMoneyAmount(value, true) ?? NaN);
  return normalizeCollection({
    name: values.name, description: values.description, status: values.status as CollectionInput['status'],
    startDate: values.startDate || null, targetDate: values.targetDate || null, notes: values.notes,
    financeQuality: values.financeQuality as CollectionInput['financeQuality'],
    productionTarget: count(values.productionTarget), producedQuantity: count(values.producedQuantity),
    salesTarget: count(values.salesTarget), soldQuantity: count(values.soldQuantity),
    plannedBudget: money(values.plannedBudget), actualRevenue: money(values.actualRevenue), actualExpense: money(values.actualExpense),
  });
}

/** Blank is unknown; only two explicitly entered actuals produce a reported result. */
export function collectionResult(collection: CollectionInput): number | null {
  if (collection.actualRevenue === null || collection.actualExpense === null) return null;
  return (Math.round(collection.actualRevenue * 100) - Math.round(collection.actualExpense * 100)) / 100;
}

export function summarizeCollections(collections: Collection[]) {
  const sumKnown = (values: (number | null)[]) => {
    const known = values.filter((value): value is number => value !== null);
    return { amount: known.length ? known.reduce((sum, value) => sum + Math.round(value * 100), 0) / 100 : null, count: known.length };
  };
  return {
    count: collections.length,
    active: collections.filter(item => item.status !== 'archived').length,
    revenue: sumKnown(collections.map(item => item.actualRevenue)),
    expense: sumKnown(collections.map(item => item.actualExpense)),
    result: sumKnown(collections.map(collectionResult)),
    includesUnconfirmed: collections.some(item => (item.actualRevenue !== null || item.actualExpense !== null) && item.financeQuality !== 'confirmed'),
  };
}
