import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Box, Camera, CheckCircle2, ClipboardList, FileText, Layers3, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Collection } from '@/types/collections';
import type { CollectionContentTab, CollectionEntry, CollectionEntryKind } from '@/types/collectionContent';
import type { useCollectionsSession } from '@/hooks/useCollectionsSession';
import { emptyCollectionContent } from '@/domain/collectionContent';
import { COLLECTION_ASSETS, collectionAsset } from '@/demo/collectionAssets';
import { ProductVisual } from './ProductVisual';
import { CollectionDetail } from './CollectionDetail';
import { CollectionDialog } from './CollectionDialog';
import { ContentEntryForm } from './ContentEntryForm';
import { STATUS, ENTRY_STATUS, PRODUCT_STATUS, formatAmount, formatCount, formatDate, primaryButton, secondaryButton } from './presentation';

const TABS = [
  { id: 'summary', label: 'Genel bakış', icon: Layers3 },
  { id: 'products', label: 'Ürünler', icon: Box },
  { id: 'production', label: 'Üretim süreci', icon: ClipboardList },
  { id: 'campaigns', label: 'Reklam / Çekim', icon: Camera },
  { id: 'files', label: 'Dosyalar', icon: FileText },
] as const;
type Popup = { kind: 'entry'; section: CollectionEntryKind; entry?: CollectionEntry } | { kind: 'remove-entry'; entry: CollectionEntry } | { kind: 'add-file' } | { kind: 'preview' | 'remove-file'; fileId: string; assetId: string } | null;

export function CollectionWorkspace({ collection, session, onEdit, onDelete }: {
  collection: Collection; session: ReturnType<typeof useCollectionsSession>; onEdit: () => void; onDelete: () => void;
}) {
  const { view, setContentTab, closeCollection, contents, busy, saveEntry, removeEntry, attachFile, removeFile } = session;
  const content = contents[collection.id] ?? emptyCollectionContent();
  const [popup, setPopup] = useState<Popup>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [assetId, setAssetId] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const tabId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [collection.id]);
  const entries = content.entries.filter(entry => entry.kind === (view.tab === 'products' ? 'product' : view.tab === 'campaigns' ? 'campaign' : 'production'));
  const section: CollectionEntryKind = view.tab === 'products' ? 'product' : view.tab === 'campaigns' ? 'campaign' : 'production';
  const addLabel = section === 'product' ? 'Ürün ekle' : section === 'production' ? 'Üretim adımı ekle' : 'Plan ekle';
  const openPopup = (next: Popup) => { setError(''); setPopup(next); };
  const preview = popup && 'assetId' in popup ? collectionAsset(popup.assetId) : undefined;
  const availableFiles = COLLECTION_ASSETS.filter(asset => !content.files.some(file => file.assetId === asset.id));
  const chooseTab = (tab: CollectionContentTab) => setContentTab(tab);

  return <div className="min-w-0 space-y-5 pb-8">
    <button type="button" onClick={closeCollection} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"><ArrowLeft className="h-4 w-4" />Koleksiyonlara dön</button>
    <header className="flex flex-col items-start gap-4 rounded-3xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 lg:flex-row lg:justify-between">
      <div className="min-w-0 w-full flex-1 lg:w-auto"><p className="mb-2 text-[10px] font-black tracking-[0.18em] text-emerald-600 dark:text-emerald-400">KOLEKSİYON ÇALIŞMA ALANI</p><h2 ref={heading} tabIndex={-1} className="break-words text-2xl font-black tracking-tight text-gray-900 outline-none dark:text-white sm:text-3xl">{collection.name}</h2><p className="mt-3 break-words text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{collection.description || 'Açıklama girilmedi.'}</p><span className={`mt-3 inline-block rounded-full px-3 py-1.5 text-[11px] font-bold ${STATUS[collection.status].color}`}>{STATUS[collection.status].label}</span></div>
      <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={onEdit} className={secondaryButton}><Pencil className="h-4 w-4" />Koleksiyonu düzenle</button><button type="button" aria-label="Koleksiyonu sil" onClick={onDelete} className={`${secondaryButton} text-rose-600 dark:text-rose-400`}><Trash2 className="h-4 w-4" /></button></div>
    </header>
    {notice && <p role="status" className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{notice}</p>}
    <div role="tablist" aria-label="Koleksiyon bölümleri" className="grid min-w-0 grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3 lg:grid-cols-5">{TABS.map((tab, index) => <button key={tab.id} ref={node => { tabRefs.current[index] = node; }} type="button" role="tab" id={`${tabId}-${tab.id}`} aria-selected={view.tab === tab.id} aria-controls={`${tabId}-panel`} tabIndex={view.tab === tab.id ? 0 : -1} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${view.tab === tab.id ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-gray-500 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800'}`} onClick={() => chooseTab(tab.id)} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
      chooseTab(TABS[next].id); tabRefs.current[next]?.focus(); tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }}><tab.icon className="h-4 w-4" />{tab.label}</button>)}</div>

    <section id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${view.tab}`} className="min-w-0">
      {view.tab === 'summary' ? <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"><h3 className="mb-5 text-base font-black text-gray-900 dark:text-white">Genel özet ve finans</h3><CollectionDetail collection={collection} /></div>
        <aside className="min-w-0 space-y-3"><h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Çalışma alanı</h3>{TABS.filter(tab => tab.id !== 'summary').map(tab => {
          const count = tab.id === 'files' ? content.files.length : content.entries.filter(entry => entry.kind === (tab.id === 'products' ? 'product' : tab.id === 'campaigns' ? 'campaign' : 'production')).length;
          return <button key={tab.id} type="button" onClick={() => chooseTab(tab.id)} className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"><tab.icon className="h-5 w-5 text-emerald-600" /><span className="min-w-0 flex-1 text-sm font-bold text-gray-700 dark:text-zinc-200">{tab.label}</span><span className="text-lg font-black text-gray-800 dark:text-white">{count}</span><ArrowUpRight className="h-4 w-4 text-gray-400" /></button>;
        })}</aside>
      </div> : view.tab === 'files' ? <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black text-gray-900 dark:text-white">Çizimler ve çalışma dosyaları</h3><button type="button" disabled={busy || !availableFiles.length} onClick={() => { setAssetId(availableFiles[0]?.id ?? ''); openPopup({ kind: 'add-file' }); }} className={primaryButton}><Plus className="h-4 w-4" />Dosya ekle</button></div>
        {content.files.length ? <div className="grid min-w-0 gap-4 sm:grid-cols-2">{content.files.map(file => {
          const asset = collectionAsset(file.assetId); if (!asset) return null;
          return <article key={file.id} className="min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><button type="button" aria-label={`${asset.name} önizle`} onClick={() => openPopup({ kind: 'preview', fileId: file.id, assetId: file.assetId })} className="flex h-40 w-full items-center justify-center bg-gray-50 dark:bg-zinc-950">{asset.image ? <img src={asset.path} alt={asset.name} className="h-full w-full object-contain" /> : <FileText className="h-12 w-12 text-emerald-600" />}</button><div className="p-4"><p className="text-[10px] font-bold uppercase text-gray-400">{asset.type}</p><h4 className="mt-1 break-words text-sm font-black text-gray-900 dark:text-white">{asset.name}</h4><div className="mt-4 flex flex-wrap gap-2"><a href={asset.path} target="_blank" rel="noopener noreferrer" className={secondaryButton}>Dosyayı aç<ArrowUpRight className="h-4 w-4" /></a><button type="button" aria-label={`${asset.name} kaldır`} onClick={() => openPopup({ kind: 'remove-file', fileId: file.id, assetId: file.assetId })} className={secondaryButton}><Trash2 className="h-4 w-4" /></button></div></div></article>;
        })}</div> : <Empty title="Henüz dosya eklenmedi" note="Ürün çizimi veya çekim planı ekleyerek başlayın." />}
      </> : <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black text-gray-900 dark:text-white">{TABS.find(tab => tab.id === view.tab)?.label}</h3><button type="button" disabled={busy} onClick={() => openPopup({ kind: 'entry', section })} className={primaryButton}><Plus className="h-4 w-4" />{addLabel}</button></div>
        {entries.length ? <div className={`grid min-w-0 gap-4 ${section === 'product' ? 'sm:grid-cols-2' : ''}`}>{entries.map(entry => <article key={entry.id} aria-label={entry.title} className="min-w-0 rounded-3xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">{entry.kind === 'product' && <ProductVisual name={entry.title} className="mb-4 h-44 rounded-2xl" />}<div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{entry.kind === 'product' ? PRODUCT_STATUS[entry.status] : ENTRY_STATUS[entry.status]}</p><h4 className="break-words text-base font-black text-gray-900 dark:text-white">{entry.title}</h4></div>{entry.status === 'completed' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}</div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{entry.notes || 'Henüz not eklenmedi.'}</p>{entry.kind === 'product' && <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-xs dark:bg-zinc-950"><div><dt className="text-gray-400">Ürün kodu</dt><dd className="mt-1 break-words font-bold text-gray-700 dark:text-zinc-200">{entry.sku || '—'}</dd></div><div><dt className="text-gray-400">Planlanan adet</dt><dd className="mt-1 font-bold text-gray-700 dark:text-zinc-200">{formatCount(entry.quantity)}</dd></div><div className="col-span-2"><dt className="text-gray-400">Birim fiyat</dt><dd className="mt-1 font-bold text-gray-700 dark:text-zinc-200">{formatAmount(entry.unitPrice)}</dd></div></dl>}<p className="mt-4 text-xs text-gray-400">{entry.kind === 'campaign' ? 'Planlanan tarih' : 'Hedef tarih'}: {formatDate(entry.date)}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => openPopup({ kind: 'entry', section: entry.kind, entry })} aria-label={`${entry.title} düzenle`} className={secondaryButton}><Pencil className="h-4 w-4" />Düzenle</button><button type="button" onClick={() => openPopup({ kind: 'remove-entry', entry })} aria-label={`${entry.title} sil`} className={secondaryButton}><Trash2 className="h-4 w-4" /></button></div></article>)}</div> : <Empty title={section === 'product' ? 'Henüz ürün eklenmedi' : section === 'production' ? 'Henüz üretim adımı eklenmedi' : 'Henüz reklam veya çekim planı eklenmedi'} note={section === 'product' ? 'Koleksiyona ait ürünleri, kodlarını ve planlanan adetlerini ekleyin.' : 'İlk kaydı ekleyip hedef tarihini ve durumunu belirleyin.'} />}
      </>}
    </section>

    {popup?.kind === 'entry' && <CollectionDialog title={popup.entry ? 'Kaydı düzenle' : popup.section === 'product' ? 'Yeni ürün' : popup.section === 'production' ? 'Yeni üretim adımı' : 'Yeni reklam / çekim planı'} busy={busy} onClose={() => setPopup(null)}><ContentEntryForm kind={popup.section} initial={popup.entry} busy={busy} onCancel={() => setPopup(null)} onSave={async input => { await saveEntry(collection.id, input, popup.entry?.id); setNotice(`${input.title} kaydedildi.`); setPopup(null); }} /></CollectionDialog>}
    {popup?.kind === 'remove-entry' && <CollectionDialog title="Kayıt silinsin mi?" busy={busy} onClose={() => setPopup(null)}><p className="break-words text-sm text-gray-600 dark:text-zinc-300"><strong>{popup.entry.title}</strong> bu koleksiyondan kaldırılacak.</p>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}<div className="mt-5 flex gap-3"><button data-autofocus disabled={busy} type="button" onClick={() => setPopup(null)} className={`${secondaryButton} flex-1`}>Vazgeç</button><button disabled={busy} type="button" className={`${primaryButton} flex-1`} onClick={async () => { try { await removeEntry(collection.id, popup.entry.id); setNotice('Kayıt silindi.'); setPopup(null); } catch { setError('Kayıt silinemedi. Tekrar deneyin.'); } }}>Evet, kaydı sil</button></div></CollectionDialog>}
    {popup?.kind === 'add-file' && <CollectionDialog title="Çalışma dosyası seç" busy={busy} onClose={() => setPopup(null)}><div className="space-y-3">{availableFiles.map(asset => <label key={asset.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-zinc-700"><input type="radio" name="asset" value={asset.id} checked={assetId === asset.id} onChange={() => setAssetId(asset.id)} className="accent-emerald-600" /><span className="text-sm font-bold text-gray-700 dark:text-zinc-200">{asset.name}</span></label>)}</div>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}<div className="mt-5 flex gap-3"><button type="button" disabled={busy} onClick={() => setPopup(null)} className={`${secondaryButton} flex-1`}>Vazgeç</button><button type="button" disabled={busy || !assetId} className={`${primaryButton} flex-1`} onClick={async () => { try { await attachFile(collection.id, assetId); setNotice('Dosya koleksiyona eklendi.'); setPopup(null); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Dosya eklenemedi.'); } }}>Koleksiyona ekle</button></div></CollectionDialog>}
    {popup?.kind === 'preview' && preview && <CollectionDialog title={preview.name} onClose={() => setPopup(null)}><FilePreview asset={preview} /><a href={preview.path} target="_blank" rel="noopener noreferrer" className={`${primaryButton} mt-4`}>Dosyayı aç<ArrowUpRight className="h-4 w-4" /></a></CollectionDialog>}
    {popup?.kind === 'remove-file' && preview && <CollectionDialog title="Dosya kaldırılsın mı?" busy={busy} onClose={() => setPopup(null)}><p className="text-sm text-gray-600 dark:text-zinc-300">{preview.name} bu koleksiyonun dosya listesinden kaldırılacak.</p>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}<div className="mt-5 flex gap-3"><button data-autofocus type="button" disabled={busy} onClick={() => setPopup(null)} className={`${secondaryButton} flex-1`}>Vazgeç</button><button type="button" disabled={busy} className={`${primaryButton} flex-1`} onClick={async () => { try { await removeFile(collection.id, popup.fileId); setNotice('Dosya kaldırıldı.'); setPopup(null); } catch { setError('Dosya kaldırılamadı. Tekrar deneyin.'); } }}>Evet, dosyayı kaldır</button></div></CollectionDialog>}
  </div>;
}

function Empty({ title, note }: { title: string; note: string }) {
  return <div className="rounded-3xl border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700"><Layers3 className="mx-auto h-8 w-8 text-gray-300 dark:text-zinc-600" /><h4 className="mt-3 text-base font-black text-gray-700 dark:text-zinc-200">{title}</h4><p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{note}</p></div>;
}

function FilePreview({ asset }: { asset: NonNullable<ReturnType<typeof collectionAsset>> }) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (asset.image) return;
    const controller = new AbortController();
    setText(null); setFailed(false);
    fetch(asset.path, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Dosya açılamadı.');
      return response.text();
    }).then(content => { if (!controller.signal.aborted) setText(content); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [asset.path, asset.image]);
  if (asset.image) return <img src={asset.path} alt={asset.name} className="max-h-[60dvh] w-full rounded-xl bg-gray-50 object-contain" />;
  if (failed) return <p role="alert" className="text-sm text-rose-600">Önizleme açılamadı. Dosyayı bağlantıdan yeniden açabilirsiniz.</p>;
  if (text === null) return <p role="status" className="text-sm text-gray-500">Dosya açılıyor…</p>;
  return <pre className="whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 font-sans text-sm leading-relaxed text-gray-600 dark:bg-zinc-950 dark:text-zinc-300">{text}</pre>;
}
