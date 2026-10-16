import type { CollectionStatus, FinanceQuality } from '@/types/collections';

export const STATUS: Record<CollectionStatus, { label: string; color: string }> = {
  planning: { label: 'Hazırlık', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  sampling: { label: 'Numune', color: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  production: { label: 'Üretimde', color: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  on_sale: { label: 'Satışta', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  archived: { label: 'Arşiv', color: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300' },
};
export const QUALITY: Record<FinanceQuality, string> = { unverified: 'Teyitsiz', approximate: 'Yaklaşık', confirmed: 'Kullanıcı teyitli' };
export const ENTRY_STATUS = { planned: 'Planlandı', in_progress: 'Devam ediyor', completed: 'Tamamlandı' };
export const PRODUCT_STATUS = { planned: 'Taslak', in_progress: 'Hazırlanıyor', completed: 'Hazır' };
export const inputClass = 'w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white';
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-50';
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800';
export const formatAmount = (amount: number | null) => amount === null ? 'Bilinmiyor' : `${amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;
export const formatCount = (count: number | null) => count === null ? '—' : count.toLocaleString('tr-TR');
export const formatDate = (date: string | null) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirlenmedi';
export const resultLabel = (quality: FinanceQuality) => quality === 'confirmed' ? 'Bildirilen kâr / zarar' : quality === 'approximate' ? 'Yaklaşık sonuç' : 'Teyitsiz fark';
