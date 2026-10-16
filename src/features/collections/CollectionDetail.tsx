import type { Collection } from '@/types/collections';
import { COLLECTION_STATUSES, collectionResult } from '@/domain/collections';
import { STATUS, QUALITY, formatAmount, formatCount, formatDate, resultLabel } from './presentation';

export function CollectionDetail({ collection }: { collection: Collection }) {
  const result = collectionResult(collection);
  return (
    <div className="space-y-5">
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{collection.description || 'Açıklama girilmedi.'}</p>
      <section aria-label="Koleksiyon süreci"><h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">Süreç durumu</h3><div className="flex flex-wrap gap-2">{COLLECTION_STATUSES.map(status => <span key={status} aria-current={status === collection.status ? 'step' : undefined} className={`rounded-xl px-3 py-2 text-xs font-bold ${status === collection.status ? STATUS[status].color : 'bg-gray-50 text-gray-400 dark:bg-zinc-800/50 dark:text-zinc-500'}`}>{STATUS[status].label}</span>)}</div></section>
      <dl className="grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 text-xs sm:grid-cols-2 dark:bg-zinc-950/60"><div><dt className="mb-1 text-gray-400">Başlangıç</dt><dd className="font-bold text-gray-700 dark:text-zinc-200">{formatDate(collection.startDate)}</dd></div><div><dt className="mb-1 text-gray-400">Hedef tarih</dt><dd className="font-bold text-gray-700 dark:text-zinc-200">{formatDate(collection.targetDate)}</dd></div></dl>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Target label="Üretim" actual={collection.producedQuantity} target={collection.productionTarget} /><Target label="Satış" actual={collection.soldQuantity} target={collection.salesTarget} /></div>
      <section className="rounded-2xl border border-gray-200 p-4 dark:border-zinc-700">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400">Finansal özet</h3><span className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{QUALITY[collection.financeQuality]}</span></div>
        <dl className="space-y-3 text-sm"><FinanceRow title="Planlanan bütçe" amount={collection.plannedBudget} /><FinanceRow title="Gerçekleşen gelir" amount={collection.actualRevenue} /><FinanceRow title="Gerçekleşen gider" amount={collection.actualExpense} /></dl>
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-zinc-800"><p className="text-xs font-bold text-gray-500 dark:text-zinc-400">{resultLabel(collection.financeQuality)}</p><p className={`mt-1 break-words text-2xl font-black ${result === null ? 'text-gray-400' : result < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{result === null ? 'Hesaplanamıyor' : formatAmount(result)}</p><p className="mt-2 text-[11px] leading-relaxed text-gray-400">Sonuç = gerçekleşen gelir − gerçekleşen gider. Planlanan bütçe hesaba katılmaz. Eksik değer sıfır kabul edilmez.</p></div>
      </section>
      {collection.source && <section className="rounded-2xl bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"><h3 className="font-black">{collection.manuallyEdited ? 'Başlangıç kaynağı · Kayıt manuel güncellendi' : 'Kayıt bilgileri'}</h3><p className="mt-1 font-bold">{collection.source.title} · {formatDate(collection.source.date)}</p><p className="mt-2">{collection.source.note}</p>{collection.manuallyEdited && <p className="mt-2 font-bold">Görünen alanlar sonradan elle değiştirildi; ilk kaynak, güncel tutarların teyidi değildir.</p>}</section>}
      <section><h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Süreç notları</h3><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{collection.notes || 'Henüz not eklenmedi.'}</p></section>
    </div>
  );
}

function FinanceRow({ title, amount }: { title: string; amount: number | null }) {
  return <div className="flex flex-wrap justify-between gap-2"><dt className="text-gray-500 dark:text-zinc-400">{title}</dt><dd className="font-bold text-gray-800 dark:text-white">{formatAmount(amount)}</dd></div>;
}
function Target({ label, actual, target }: { label: string; actual: number | null; target: number | null }) {
  const progress = actual !== null && target !== null && target > 0 ? Math.min(100, actual / target * 100) : null;
  return <section className="min-w-0 rounded-2xl border border-gray-200 p-4 dark:border-zinc-700"><h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400">{label} · gerçekleşen / hedef</h3><p className="mt-2 text-xl font-black text-gray-800 dark:text-white">{formatCount(actual)} <span className="text-sm font-medium text-gray-400">/ {formatCount(target)} adet</span></p>{progress !== null ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800" aria-label={`${label} hedefinin yüzde ${Math.round(progress)} kadarı`}><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div> : <p className="mt-2 text-[11px] text-gray-400">Eksik hedef veya gerçekleşen adet için ilerleme hesaplanmaz.</p>}</section>;
}
