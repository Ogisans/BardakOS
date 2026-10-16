import { X } from 'lucide-react';
import { colorLabel, formatTry, type CartItem, type PaymentMethod } from '@/data';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface ConfirmData {
  items: CartItem[];
  method: PaymentMethod;
  total: number;
}

interface ConfirmModalProps {
  open: boolean;
  data: ConfirmData | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, data, onConfirm, onCancel }: ConfirmModalProps) {
  useBodyScrollLock(open);
  if (!open || !data) return null;

  const methodLabel =
    data.method === 'cash' ? 'Nakit' : data.method === 'shopier' ? 'Shopier' : 'IBAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="animate-modal-in relative m-4 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Onay
            </p>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Satışı Onaylıyor musunuz?
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          <p className="mb-2 text-xs font-black tracking-wider text-gray-400 dark:text-zinc-500">
            SEPET ÖZETİ
          </p>
          <div className="space-y-2">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-zinc-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {colorLabel(item.color)} • {item.size}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-400">
                    {item.quantity} Adet
                  </p>
                </div>
                <span className="shrink-0 text-sm font-black text-gray-900 dark:text-white">
                  {formatTry(item.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-3 h-px bg-gray-100 dark:bg-zinc-800" />

          <SummaryRow label="Satış Kanalı" value={methodLabel} />
        </div>

        <div className="border-t border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">
              Toplam Tutar
            </span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {formatTry(data.total)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="h-14 rounded-2xl border border-gray-200 text-base font-black text-gray-700 transition active:scale-95 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              İptal
            </button>
            <button
              onClick={onConfirm}
              className="h-14 rounded-2xl bg-emerald-500 text-base font-black text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 hover:bg-emerald-600"
            >
              Evet, Onayla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">{label}</span>
      <span className="text-base font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
