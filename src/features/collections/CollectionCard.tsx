import { ArrowUpRight, Layers3, Pencil, Trash2 } from 'lucide-react';
import type { Collection } from '@/types/collections';
import { collectionResult } from '@/domain/collections';
import { STATUS, QUALITY, formatAmount, formatCount, formatDate, resultLabel } from './presentation';
import { ProductVisual } from './ProductVisual';

// Photo overlays need an opaque background in both themes.
const PHOTO_STATUS: Record<Collection['status'], string> = {
  planning: 'bg-amber-100 text-amber-950',
  sampling: 'bg-sky-100 text-sky-950',
  production: 'bg-violet-100 text-violet-950',
  on_sale: 'bg-emerald-100 text-emerald-950',
  archived: 'bg-zinc-100 text-zinc-900',
};

export function CollectionCard({ collection, onOpen, onEdit, onDelete }: {
  collection: Collection; onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const result = collectionResult(collection);
  return (
    <article aria-label={collection.name} className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative border-b border-gray-100 dark:border-zinc-800">
        <button type="button" aria-label={`${collection.name} görselinden koleksiyonu aç`} onClick={onOpen} className="block w-full"><ProductVisual name={collection.name} className="h-52" /></button>
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"><Layers3 className="h-6 w-6" /></div>
        <span className={`rounded-full border border-white/80 px-3 py-1.5 text-[11px] font-bold shadow-sm ${PHOTO_STATUS[collection.status]}`}>{STATUS[collection.status].label}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-[10px] font-black tracking-[0.18em] text-gray-400 dark:text-zinc-500">BARDAK STÜDYO</p>
        <h3 className="break-words text-xl font-black text-gray-900 dark:text-white"><button type="button" aria-label={`${collection.name} koleksiyonunu aç`} onClick={onOpen} className="text-left hover:text-emerald-700 dark:hover:text-emerald-400">{collection.name}</button></h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{collection.description || 'Bu koleksiyon için henüz açıklama girilmedi.'}</p>
        <div className="my-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-zinc-950/60">
          <div><p className="text-[10px] font-bold uppercase text-gray-400">Üretim / hedef</p><p className="mt-1 text-sm font-black text-gray-800 dark:text-zinc-200">{formatCount(collection.producedQuantity)} <span className="font-medium text-gray-400">/ {formatCount(collection.productionTarget)}</span></p></div>
          <div><p className="text-[10px] font-bold uppercase text-gray-400">Satış / hedef</p><p className="mt-1 text-sm font-black text-gray-800 dark:text-zinc-200">{formatCount(collection.soldQuantity)} <span className="font-medium text-gray-400">/ {formatCount(collection.salesTarget)}</span></p></div>
        </div>
        <dl className="space-y-2 text-xs"><MoneyRow label="Planlanan bütçe" amount={collection.plannedBudget} /><MoneyRow label="Gerçekleşen gelir" amount={collection.actualRevenue} /><MoneyRow label="Gerçekleşen gider" amount={collection.actualExpense} /></dl>
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-gray-500 dark:text-zinc-400">{resultLabel(collection.financeQuality)}</p><span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">{QUALITY[collection.financeQuality]}</span></div>
          <p className={`mt-1 break-words text-2xl font-black ${result === null ? 'text-gray-400' : result < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{result === null ? 'Hesaplanamıyor' : formatAmount(result)}</p>
          {result === null && <p className="mt-1 text-[11px] text-gray-400">Gelir ve giderin ikisi de gerekli.</p>}
        </div>
        <p className="mb-4 mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-zinc-500">{collection.source ? `${collection.manuallyEdited ? 'Manuel güncellendi · İlk kayıt' : 'Kayıt tarihi'}: ${formatDate(collection.source.date)}` : 'Koleksiyon kaydı'}</p>
        <footer className="mt-auto flex items-center gap-2"><button onClick={onOpen} className="flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-xl bg-gray-50 px-3 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-emerald-500/10" aria-label={`${collection.name} detaylarını aç`}>Koleksiyonu aç<ArrowUpRight className="h-4 w-4" /></button><button onClick={onEdit} aria-label={`${collection.name} koleksiyonunu düzenle`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"><Pencil className="h-4 w-4" /></button><button onClick={onDelete} aria-label={`${collection.name} koleksiyonunu sil`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></footer>
      </div>
    </article>
  );
}

function MoneyRow({ label, amount }: { label: string; amount: number | null }) {
  return <div className="flex flex-wrap justify-between gap-1"><dt className="text-gray-500 dark:text-zinc-400">{label}</dt><dd className="font-bold text-gray-800 dark:text-zinc-200">{formatAmount(amount)}</dd></div>;
}
