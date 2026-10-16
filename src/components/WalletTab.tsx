import {
  Banknote,
  Building2,
  Globe,
  Pencil,
  Wallet,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  formatTry,
  PAYMENT_LABELS,
  type PaymentMethod,
  type SaleRecord,
} from '@/data';

interface WalletTabProps {
  sales: SaleRecord[];
  startingCash: number | null;
  onSetStartingCash: (amount: number) => void;
}

type ChannelId = PaymentMethod;

const CHANNELS: { id: ChannelId; icon: ReactNode; accent: string; bg: string; text: string }[] = [
  {
    id: 'cash',
    icon: <Banknote className="h-5 w-5" strokeWidth={2.5} />,
    accent: 'emerald',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'iban',
    icon: <Building2 className="h-5 w-5" strokeWidth={2.5} />,
    accent: 'sky',
    bg: 'bg-sky-100 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'shopier',
    icon: <Globe className="h-5 w-5" strokeWidth={2.5} />,
    accent: 'amber',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
  },
];

export function WalletTab({ sales, startingCash, onSetStartingCash }: WalletTabProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const todaySales = useMemo(
    () => sales.filter((s) => s.timestamp >= todayStart),
    [sales, todayStart],
  );

  const totals = useMemo(() => {
    const byMethod: Record<ChannelId, number> = { cash: 0, iban: 0, shopier: 0 };
    for (const sale of todaySales) {
      byMethod[sale.method] += sale.total;
    }
    return byMethod;
  }, [todaySales]);

  const grandTotal = totals.cash + totals.iban + totals.shopier;
  const cashTotal = totals.cash + (startingCash ?? 0);
  const soldItems = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  return (
    <div className="flex h-full flex-col gap-3 md:grid md:grid-cols-2 md:gap-6 md:items-start">
      <div className="flex flex-col gap-3 md:self-stretch">
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-gray-100 px-5 py-3.5 dark:border-zinc-800">
            <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              {formatDate(today)}
            </p>
            <h2 className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">
              Cüzdan
            </h2>
          </div>

          <div className="px-5 py-4">
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/60">
              <div>
                <p className="text-xs font-bold tracking-wider text-gray-400 dark:text-zinc-400">
                  GÜNÜN TOPLAMI
                </p>
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                  {todaySales.length} satış · {soldItems} ürün
                </p>
              </div>
              <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {formatTry(grandTotal)}
              </p>
            </div>

            {startingCash !== null && (
              <p className="mt-2 px-1 text-xs font-semibold text-gray-400 dark:text-zinc-500">
                Nakit toplamı, gün başı {formatTry(startingCash)} içerir.
              </p>
            )}
          </div>
        </section>

        <section className="shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-4 text-left transition hover:bg-emerald-100 active:scale-[0.98] dark:border-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Pencil className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-gray-900 dark:text-white">
                Gün Başı Kasası
              </p>
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {startingCash !== null
                  ? `${formatTry(startingCash)} olarak ayarlandı`
                  : 'Henüz belirlenmedi — tıkla ve gir'}
              </p>
            </div>
            <Wallet className="h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
        </section>
      </div>

      <section className="flex-1 space-y-2.5 md:self-stretch">
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            Ödeme Kanalları
          </h3>
        </div>
        {CHANNELS.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${channel.bg} ${channel.text}`}>
              {channel.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {PAYMENT_LABELS[channel.id].tr}
              </p>
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-400">
                {PAYMENT_LABELS[channel.id].sub}
              </p>
            </div>
            <p className="shrink-0 text-lg font-black text-gray-900 dark:text-white">
              {formatTry(channel.id === 'cash' ? cashTotal : totals[channel.id])}
            </p>
          </div>
        ))}
      </section>

      {modalOpen && (
        <StartingCashModal
          current={startingCash}
          onClose={() => setModalOpen(false)}
          onSave={(amount) => {
            onSetStartingCash(amount);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function StartingCashModal({
  current,
  onClose,
  onSave,
}: {
  current: number | null;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  useBodyScrollLock(true);
  const [value, setValue] = useState(current?.toString() ?? '');

  const parsed = parseInt(value.replace(/\D/g, ''), 10);
  const valid = !Number.isNaN(parsed) && parsed >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-modal-in relative m-4 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              GÜN BAŞI KASASI
            </p>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              Nakit Başlangıcı
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="mb-3 text-sm font-semibold text-gray-500 dark:text-zinc-400">
            Güne ne kadar nakitle başladığınızı girin. Bu tutar gün içi nakit
            toplamına eklenir.
          </p>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 dark:bg-zinc-800/60">
            <Banknote className="h-6 w-6 shrink-0 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
            <input
              inputMode="numeric"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-black text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-zinc-600"
            />
            <span className="shrink-0 text-xl font-black text-gray-400 dark:text-zinc-500">₺</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="h-14 rounded-2xl border border-gray-200 text-base font-black text-gray-700 transition active:scale-95 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>
          <button
            onClick={() => valid && onSave(parsed)}
            disabled={!valid}
            className={`h-14 rounded-2xl text-base font-black text-white transition active:scale-95 ${
              valid
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600'
                : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600'
            }`}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}
