import { useRef, useState, type ReactNode } from 'react';
import type { CollectionEntry, CollectionEntryInput, CollectionEntryKind, CollectionEntryStatus } from '@/types/collectionContent';
import { ContentValidationError, normalizeContentEntry } from '@/domain/collectionContent';
import { parseMoneyAmount } from '@/domain/money';
import { DatePicker } from './DatePicker';
import { CollectionSelect } from './CollectionSelect';
import { inputClass, primaryButton, secondaryButton, ENTRY_STATUS, PRODUCT_STATUS } from './presentation';

export function ContentEntryForm({ kind, initial, busy, onSave, onCancel }: {
  kind: CollectionEntryKind; initial?: CollectionEntry; busy: boolean;
  onSave: (input: CollectionEntryInput) => Promise<void>; onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [status, setStatus] = useState<CollectionEntryStatus>(initial?.status ?? 'planned');
  const [sku, setSku] = useState(initial?.kind === 'product' ? initial.sku : '');
  const [quantity, setQuantity] = useState(initial?.kind === 'product' ? String(initial.quantity ?? '') : '');
  const [price, setPrice] = useState(initial?.kind === 'product' ? String(initial.unitPrice ?? '') : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const statuses = kind === 'product' ? PRODUCT_STATUS : ENTRY_STATUS;
  const titleLabel = kind === 'product' ? 'Ürün adı' : kind === 'production' ? 'Üretim adımı' : 'Plan adı';
  const field = (name: string, label: string, child: ReactNode) => <div className="min-w-0"><label htmlFor={`entry-${name}`} className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-zinc-200">{label}</label>{child}{errors[name] && <p id={`entry-${name}-error`} role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors[name]}</p>}</div>;
  return <form ref={form} noValidate className="space-y-5" onSubmit={async event => {
    event.preventDefault(); if (busy) return;
    setFailure(''); setErrors({});
    try {
      const base = { title, notes, date: date || null, status };
      const input: CollectionEntryInput = kind === 'product' ? { ...base, kind, sku, quantity: quantity.trim() ? Number(quantity) : null, unitPrice: price.trim() ? parseMoneyAmount(price, true) ?? NaN : null } : { ...base, kind };
      await onSave(normalizeContentEntry(input));
    } catch (error) {
      if (error instanceof ContentValidationError) {
        setErrors(error.fields);
        const first = form.current?.elements.namedItem(Object.keys(error.fields)[0]);
        if (first instanceof HTMLElement) first.focus();
      } else setFailure('Kayıt tamamlanamadı. Bilgilerinizi koruduk; tekrar deneyin.');
    }
  }}>
    {failure && <p role="alert" className="text-sm text-rose-600">{failure}</p>}
    <fieldset disabled={busy} className="min-w-0 space-y-4">
      {field('title', titleLabel, <input id="entry-title" name="title" data-autofocus value={title} onChange={event => setTitle(event.target.value)} maxLength={120} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'entry-title-error' : undefined} className={inputClass} />)}
      {kind === 'product' && <>
        {field('sku', 'Ürün kodu', <input id="entry-sku" name="sku" value={sku} onChange={event => setSku(event.target.value)} maxLength={60} className={inputClass} />)}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('quantity', 'Planlanan adet', <input id="entry-quantity" name="quantity" type="number" min="0" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} aria-invalid={Boolean(errors.quantity)} className={inputClass} />)}
          {field('unitPrice', 'Birim fiyat (₺)', <input id="entry-unitPrice" name="unitPrice" type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} aria-invalid={Boolean(errors.unitPrice)} className={inputClass} />)}
        </div>
      </>}
      {field('status', 'Durum', <CollectionSelect id="entry-status" name="status" label="Durum" value={status} onChange={value => setStatus(value as CollectionEntryStatus)} disabled={busy} options={Object.entries(statuses).map(([value, label]) => ({ value, label }))} />)}
      {field('date', kind === 'campaign' ? 'Planlanan tarih' : 'Hedef tarihi', <DatePicker id="entry-date" name="date" label={kind === 'campaign' ? 'Planlanan tarih' : 'Hedef tarihi'} value={date} onChange={setDate} disabled={busy} invalid={Boolean(errors.date)} describedBy={errors.date ? 'entry-date-error' : undefined} />)}
      {field('notes', 'Notlar', <textarea id="entry-notes" name="notes" value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} rows={3} className={inputClass} />)}
    </fieldset>
    <footer className="flex gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800"><button type="button" disabled={busy} onClick={onCancel} className={`${secondaryButton} flex-1`}>Vazgeç</button><button type="submit" disabled={busy} className={`${primaryButton} flex-1`}>{busy ? 'Kaydediliyor…' : initial ? 'Değişiklikleri kaydet' : 'Kaydı ekle'}</button></footer>
  </form>;
}
