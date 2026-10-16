import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Layers3, Plus, Search, Trash2 } from 'lucide-react';
import type { CollectionInput, CollectionStatus } from '@/types/collections';
import type { useCollectionsSession } from '@/hooks/useCollectionsSession';
import { COLLECTION_STATUSES, summarizeCollections } from '@/domain/collections';
import { CollectionSelect } from './CollectionSelect';
import { CollectionCard } from './CollectionCard';
import { CollectionDialog } from './CollectionDialog';
import { CollectionForm } from './CollectionForm';
import { CollectionWorkspace } from './CollectionWorkspace';
import { STATUS, formatAmount, inputClass, primaryButton, secondaryButton } from './presentation';

type Dialog = { kind: 'create' } | { kind: 'edit' | 'delete'; id: string } | null;

export function CollectionsTab({ session }: { session: ReturnType<typeof useCollectionsSession> }) {
  const { collections, loading, loadError, busy, createCollection, updateCollection, removeCollection } = session;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CollectionStatus | 'all'>('all');
  const [notice, setNotice] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const closeDialog = useCallback(() => setDialog(null), []);
  const selected = dialog && 'id' in dialog ? collections.find(item => item.id === dialog.id) : undefined;
  const activeCollection = collections.find(item => item.id === session.view.collectionId);
  const summary = useMemo(() => summarizeCollections(collections), [collections]);
  const visible = useMemo(() => collections.filter(item => (filter === 'all' || item.status === filter) && `${item.name} ${item.description}`.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR'))), [collections, filter, query]);
  const startDelete = (id: string) => { setDeleteError(''); setDialog({ kind: 'delete', id }); };
  const save = async (input: CollectionInput) => {
    const record = dialog?.kind === 'edit' && selected ? await updateCollection(selected.id, input) : await createCollection(input);
    setNotice(`${record.name} ${dialog?.kind === 'edit' ? 'güncellendi' : 'oluşturuldu'}.`);
    if (session.view.collectionId !== record.id) session.openCollection(record.id);
    setDialog(null);
  };
  const coverage = (count: number) => `${count} / ${summary.count} koleksiyonda tutar var`;
  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      <div className="flex items-center justify-end gap-3">{loadError && <p role="alert" className="text-xs text-rose-600">Veriler doğrulanamadı; yeniden yükleyin.</p>}<button type="button" disabled={loading || (busy && !loadError)} onClick={() => void session.reload()} className={secondaryButton}>{loading ? 'Yükleniyor…' : 'Verileri yenile'}</button></div>
      {activeCollection ? <CollectionWorkspace collection={activeCollection} session={session} onEdit={() => setDialog({ kind: 'edit', id: activeCollection.id })} onDelete={() => startDelete(activeCollection.id)} /> : <>
      <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[0.18em] text-emerald-600 dark:text-emerald-400">STÜDYO ARŞİVİ & YENİ SERİLER</p><h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900 dark:text-white">Koleksiyonlar</h2><p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Fikirden üretime, satıştan arşive.</p></div><button disabled={loading || busy || loadError} onClick={() => setDialog({ kind: 'create' })} className={primaryButton}><Plus className="h-4 w-4" />Yeni koleksiyon</button></header>
      {notice && <p role="status" className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{notice}</p>}
      {loading ? <p role="status" className="py-12 text-center text-sm text-gray-500">Koleksiyonlar yükleniyor…</p> : loadError ? <p role="alert" className="rounded-2xl border border-rose-200 p-5 text-sm text-rose-600">Koleksiyonlar yüklenemedi. Lütfen sayfayı yeniden açmayı deneyin.</p> : <>
        <section aria-label="Tüm koleksiyonların özeti" className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Koleksiyonlar" value={String(summary.count)} hint={`${summary.active} aktif · ${summary.count - summary.active} arşiv`} />
          <Stat label="Bildirilen gelir" value={formatAmount(summary.revenue.amount)} hint={coverage(summary.revenue.count)} />
          <Stat label="Bildirilen gider" value={formatAmount(summary.expense.amount)} hint={coverage(summary.expense.count)} />
          <Stat label="Hesaplanabilir sonuç" value={summary.result.amount === null ? 'Hesaplanamıyor' : formatAmount(summary.result.amount)} hint={`${summary.result.count} / ${summary.count} koleksiyonda iki tutar da var`} negative={summary.result.amount !== null && summary.result.amount < 0} />
        </section>
        <p className="-mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-zinc-500">Özet tüm koleksiyonları kapsar. Sonuç yalnız gelir ve gideri birlikte girilen kayıtların farkıdır; eksikler toplamda sıfır kabul edilmez.{summary.includesUnconfirmed && ' Yaklaşık veya teyitsiz kayıtlar içerir.'}</p>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" /><input aria-label="Koleksiyon ara" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Koleksiyon ara…" className={`${inputClass} pl-9`} /></div><CollectionSelect label="Duruma göre filtrele" value={filter} onChange={value => setFilter(value as CollectionStatus | 'all')} className="sm:w-48 sm:shrink-0" options={[{ value: 'all', label: 'Tüm durumlar' }, ...COLLECTION_STATUSES.map(status => ({ value: status, label: STATUS[status].label }))]} /></div>
        {visible.length ? <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">{visible.map(collection => <CollectionCard key={collection.id} collection={collection} onOpen={() => session.openCollection(collection.id)} onEdit={() => setDialog({ kind: 'edit', id: collection.id })} onDelete={() => startDelete(collection.id)} />)}</div> : <div className="rounded-3xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-zinc-700"><Layers3 className="mx-auto h-9 w-9 text-gray-300 dark:text-zinc-600" /><h3 className="mt-3 text-base font-black text-gray-800 dark:text-white">{collections.length ? 'Eşleşen koleksiyon yok' : 'İlk koleksiyonunuzu oluşturun'}</h3><p className="mt-1 text-sm text-gray-500">{collections.length ? 'Aramayı veya durum filtresini değiştirin.' : 'Adını, sürecini ve bildiğiniz hedefleri girerek başlayın.'}</p><button className={`${secondaryButton} mt-4`} onClick={() => { if (collections.length) { setQuery(''); setFilter('all'); } else setDialog({ kind: 'create' }); }}>{collections.length ? 'Filtreleri temizle' : 'Yeni koleksiyon'}</button></div>}
      </>}
      </>}
      {dialog?.kind === 'create' && <CollectionDialog key="create" title="Yeni koleksiyon" onClose={closeDialog} busy={busy}><CollectionForm onSave={save} onCancel={closeDialog} busy={busy} /></CollectionDialog>}
      {selected && dialog?.kind === 'edit' && <CollectionDialog key={`edit-${selected.id}`} title="Koleksiyonu düzenle" onClose={closeDialog} busy={busy}><CollectionForm initial={selected} onSave={save} onCancel={closeDialog} busy={busy} /></CollectionDialog>}
      {selected && dialog?.kind === 'delete' && <CollectionDialog key={`delete-${selected.id}`} title="Koleksiyon silinsin mi?" onClose={closeDialog} busy={busy}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10"><Trash2 className="h-6 w-6" /></div><p className="mt-4 break-words text-sm leading-relaxed text-gray-600 dark:text-zinc-300"><strong>{selected.name}</strong> koleksiyonu, ürünleri, süreç/çekim planları ve dosya ilişkileri bu oturumdan kaldırılacak. Bu işlem mevcut saha satışlarını ve stoklarını etkilemez.</p>{deleteError && <p role="alert" className="mt-3 text-sm text-rose-600">{deleteError}</p>}<div className="mt-5 flex gap-3"><button data-autofocus type="button" disabled={busy} onClick={closeDialog} className={`${secondaryButton} flex-1`}>Vazgeç</button><button type="button" disabled={busy} className="min-h-11 flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50" onClick={async () => { try { await removeCollection(selected.id); setNotice(`${selected.name} silindi.`); closeDialog(); } catch { setDeleteError('Silme tamamlanamadı. Tekrar deneyin.'); } }}>{busy ? 'Siliniyor…' : 'Evet, koleksiyonu sil'}</button></div></CollectionDialog>}
    </div>
  );
}

function Stat({ label, value, hint, negative = false }: { label: string; value: ReactNode; hint: string; negative?: boolean }) {
  return <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">{label}</h3><p className={`mt-2 break-words text-xl font-black sm:text-2xl ${negative ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>{value}</p><p className="mt-1 text-[10px] leading-relaxed text-gray-400">{hint}</p></div>;
}
