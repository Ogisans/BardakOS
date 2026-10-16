import { useRef, useState, type ReactNode } from 'react';
import type { CollectionErrors, CollectionFormValues, CollectionInput } from '@/types/collections';
import { COLLECTION_STATUSES, FINANCE_QUALITIES, CollectionValidationError, collectionFormValues, parseCollectionForm } from '@/domain/collections';
import { CollectionSelect } from './CollectionSelect';
import { DatePicker } from './DatePicker';
import { STATUS, QUALITY, inputClass, primaryButton, secondaryButton } from './presentation';

export function CollectionForm({ initial, onSave, onCancel, busy }: {
  initial?: CollectionInput; onSave: (input: CollectionInput) => Promise<void>; onCancel: () => void; busy: boolean;
}) {
  const [values, setValues] = useState(() => collectionFormValues(initial));
  const [errors, setErrors] = useState<CollectionErrors>({});
  const [failure, setFailure] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const change = (field: keyof CollectionFormValues, value: string) => {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
  };
  const field = (key: keyof CollectionFormValues, label: string, type = 'text', hint?: string) => (
    <Field name={key} label={label} error={errors[key]} hint={hint}>
      <input id={`collection-${key}`} name={key} data-autofocus={key === 'name' ? true : undefined} type={type} value={values[key]} onChange={event => change(key, event.target.value)} className={inputClass} required={key === 'name'} maxLength={key === 'name' ? 100 : undefined} min={type === 'number' ? 0 : undefined} step={type === 'number' ? (['plannedBudget', 'actualRevenue', 'actualExpense'].includes(key) ? '0.01' : '1') : undefined} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `collection-${key}-error` : undefined} />
    </Field>
  );
  return (
    <form ref={form} noValidate className="space-y-6" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setFailure('');
      try { await onSave(parseCollectionForm(values)); }
      catch (error) {
        if (error instanceof CollectionValidationError) {
          setErrors(error.fields);
          const first = form.current?.elements.namedItem(Object.keys(error.fields)[0]);
          if (first instanceof HTMLElement) first.focus();
        } else setFailure('Kayıt tamamlanamadı. Bilgileriniz formda duruyor; tekrar deneyin.');
      }
    }}>
      <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500 dark:bg-zinc-800/70 dark:text-zinc-400">Bilinmeyen alanları boş bırakın. <strong>0</strong> açıkça sıfır demektir. Planlanan bütçe, gerçekleşen gider olarak sayılmaz.</p>
      {failure && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{failure}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <legend className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Koleksiyon bilgileri</legend>
        {field('name', 'Koleksiyon adı')}
        <Field name="description" label="Kısa açıklama" error={errors.description}><textarea id="collection-description" name="description" value={values.description} maxLength={600} rows={2} onChange={event => change('description', event.target.value)} className={inputClass} /></Field>
        <Field name="status" label="Süreç durumu" error={errors.status}><CollectionSelect id="collection-status" name="status" label="Süreç durumu" value={values.status} onChange={value => change('status', value)} disabled={busy} invalid={Boolean(errors.status)} describedBy={errors.status ? 'collection-status-error' : undefined} options={COLLECTION_STATUSES.map(status => ({ value: status, label: STATUS[status].label }))} /></Field>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{(['startDate', 'targetDate'] as const).map(key => <Field key={key} name={key} label={key === 'startDate' ? 'Başlangıç tarihi' : 'Hedef tarihi'} error={errors[key]}><DatePicker id={`collection-${key}`} name={key} label={key === 'startDate' ? 'Başlangıç tarihi' : 'Hedef tarihi'} value={values[key]} onChange={value => change(key, value)} disabled={busy} invalid={Boolean(errors[key])} describedBy={errors[key] ? `collection-${key}-error` : undefined} /></Field>)}</div>
      </fieldset>
      <fieldset disabled={busy} className="min-w-0">
        <legend className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Üretim ve satış · adet</legend>
        <div className="grid min-w-0 grid-cols-2 gap-4">{field('productionTarget', 'Üretim hedefi', 'number')}{field('producedQuantity', 'Üretilen adet', 'number')}{field('salesTarget', 'Satış hedefi', 'number')}{field('soldQuantity', 'Satılan adet', 'number')}</div>
      </fieldset>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <legend className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Finans · Türk lirası</legend>
        {field('plannedBudget', 'Planlanan bütçe (₺)', 'number', 'Hedef maliyet / sermaye planı; harcama değildir.')}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{field('actualRevenue', 'Gerçekleşen gelir (₺)', 'number')}{field('actualExpense', 'Gerçekleşen gider (₺)', 'number')}</div>
        <Field name="financeQuality" label="Finansal veri niteliği" error={errors.financeQuality} hint="Kullanıcı teyitli, bu tutarları sizin doğruladığınızı belirtir; banka entegrasyonu değildir."><CollectionSelect id="collection-financeQuality" name="financeQuality" label="Finansal veri niteliği" value={values.financeQuality} onChange={value => change('financeQuality', value)} disabled={busy} invalid={Boolean(errors.financeQuality)} describedBy={errors.financeQuality ? 'collection-financeQuality-error' : undefined} options={FINANCE_QUALITIES.map(quality => ({ value: quality, label: QUALITY[quality] }))} /></Field>
      </fieldset>
      <fieldset disabled={busy} className="min-w-0"><Field name="notes" label="Süreç notları" error={errors.notes}><textarea id="collection-notes" name="notes" value={values.notes} maxLength={2000} rows={3} onChange={event => change('notes', event.target.value)} className={inputClass} /></Field></fieldset>
      <footer className="sticky -bottom-5 -mx-5 flex gap-3 border-t border-gray-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900"><button type="button" onClick={onCancel} disabled={busy} className={`${secondaryButton} flex-1`}>Vazgeç</button><button type="submit" disabled={busy} className={`${primaryButton} flex-1`}>{busy ? 'Kaydediliyor…' : initial ? 'Değişiklikleri kaydet' : 'Koleksiyonu oluştur'}</button></footer>
    </form>
  );
}

function Field({ name, label, hint, error, children }: { name: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return <div className="min-w-0"><label htmlFor={`collection-${name}`} className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-zinc-200">{label}</label>{children}{hint && <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400">{hint}</p>}{error && <p id={`collection-${name}-error`} role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}</div>;
}
