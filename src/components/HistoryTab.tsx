import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Clock,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  colorById,
  colorLabel,
  formatTry,
  PAYMENT_LABELS,
  type SaleRecord,
  type TransferRecord,
} from '@/data';

interface HistoryTabProps {
  sales: SaleRecord[];
  transfers: TransferRecord[];
}

type HistoryMode = 'sales' | 'transfers';

export function HistoryTab({ sales, transfers }: HistoryTabProps) {
  const [mode, setMode] = useState<HistoryMode>('sales');
  const [detail, setDetail] = useState<SaleRecord | TransferRecord | null>(null);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const todaySales = useMemo(
    () => sales.filter((s) => s.timestamp >= todayStart).sort((a, b) => b.timestamp - a.timestamp),
    [sales, todayStart],
  );
  const todayTransfers = useMemo(
    () =>
      transfers
        .filter((t) => t.timestamp >= todayStart)
        .sort((a, b) => b.timestamp - a.timestamp),
    [transfers, todayStart],
  );

  const isSales = mode === 'sales';
  const records = isSales ? todaySales : todayTransfers;

  const saleCount = todaySales.length;
  const soldItems = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  const transferCount = todayTransfers.length;
  const transferredItems = todayTransfers.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0),
    0,
  );

  return (
    <div className="flex h-full flex-col gap-3 md:grid md:grid-cols-2 md:gap-6 md:items-start">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-100 px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            {formatDate(today)}
          </p>
          <h2 className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">
            Geçmiş
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4">
          <ModeButton active={isSales} onClick={() => setMode('sales')}>
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
            Satış Geçmişi
          </ModeButton>
          <ModeButton active={!isSales} onClick={() => setMode('transfers')}>
            <ArrowDownToLine className="h-4 w-4" strokeWidth={2.5} />
            Transfer Geçmişi
          </ModeButton>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <SummaryStat
            label={isSales ? 'SEPET' : 'TRANSFER'}
            value={isSales ? saleCount : transferCount}
          />
          <SummaryStat
            label={isSales ? 'ÜRÜN' : 'ÜRÜN'}
            value={isSales ? soldItems : transferredItems}
          />
        </div>
      </section>

      <section className="flex-1 overflow-y-auto no-scrollbar md:self-stretch">
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            {isSales ? 'Satışlar' : 'Transferler'}
          </h3>
          {records.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              {records.length} KAYIT
            </span>
          )}
        </div>

        {records.length === 0 ? (
          <div className="flex min-h-[6rem] items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
            <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">
              {isSales ? 'Bugün satış kaydı yok' : 'Bugün transfer kaydı yok'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {isSales
              ? (todaySales as SaleRecord[]).map((sale) => (
                  <HistoryCard
                    key={sale.id}
                    onClick={() => setDetail(sale)}
                    icon={
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
                      </div>
                    }
                    time={sale.timestamp}
                    title={`${sale.items.length} çeşit ürün`}
                    subtitle={PAYMENT_LABELS[sale.method].tr}
                    right={<span className="text-sm font-black text-gray-900 dark:text-white">{formatTry(sale.total)}</span>}
                  />
                ))
              : (todayTransfers as TransferRecord[]).map((transfer) => {
                  const totalQty = transfer.items.reduce((s, i) => s + i.qty, 0);
                  const isCompleted = transfer.action === 'completed';
                  return (
                    <HistoryCard
                      key={transfer.id}
                      onClick={() => setDetail(transfer)}
                      icon={
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                          }`}
                        >
                          {isCompleted ? (
                            <ArrowDownToLine className="h-4 w-4" strokeWidth={2.5} />
                          ) : (
                            <ArrowUpFromLine className="h-4 w-4" strokeWidth={2.5} />
                          )}
                        </div>
                      }
                      time={transfer.timestamp}
                      title={`${totalQty} ürün · ${transfer.items.length} çeşit`}
                      subtitle={isCompleted ? 'Transfer tamamlandı' : 'Transfer iptal edildi'}
                      right={
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          }`}
                        >
                          {isCompleted ? 'TAMAMLANDI' : 'İPTAL'}
                        </span>
                      }
                    />
                  );
                })}
          </div>
        )}
      </section>

      {detail && (
        <HistoryDetailModal
          record={detail}
          isSales={isSales}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function HistoryCard({
  icon,
  time,
  title,
  subtitle,
  right,
  onClick,
}: {
  icon: ReactNode;
  time: number;
  title: string;
  subtitle: string;
  right: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-emerald-300 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{title}</p>
        <p className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-zinc-400">
          <Clock className="h-3 w-3" strokeWidth={2.5} />
          {formatTime(time)} · {subtitle}
        </p>
      </div>
      {right}
    </button>
  );
}

function HistoryDetailModal({
  record,
  isSales,
  onClose,
}: {
  record: SaleRecord | TransferRecord;
  isSales: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-modal-in relative m-4 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              {isSales ? 'SATIŞ DETAYI' : 'TRANSFER DETAYI'}
            </p>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {isSales
                ? formatTime((record as SaleRecord).timestamp)
                : formatTime((record as TransferRecord).timestamp)}
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

        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          <p className="mb-2 text-xs font-black tracking-wider text-gray-400 dark:text-zinc-500">
            {isSales ? 'SEPET ÖZETİ' : 'TRANSFER DETAYLARI'}
          </p>
          <div className="space-y-2">
            {isSales
              ? (record as SaleRecord).items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-zinc-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: colorById(item.color).swatch }}
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {colorLabel(item.color)} • {item.size}
                        </p>
                        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-400">
                          {item.quantity} Adet
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-black text-gray-900 dark:text-white">
                      {formatTry(item.price)}
                    </span>
                  </div>
                ))
              : (record as TransferRecord).items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-zinc-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: colorById(item.color).swatch }}
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {colorLabel(item.color)} • {item.size} Beden
                        </p>
                        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-400">
                          Araçtan tezgaha
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-black text-gray-900 dark:text-white">
                      {item.qty}x
                    </span>
                  </div>
                ))}
          </div>

          {isSales && (
            <>
              <div className="my-3 h-px bg-gray-100 dark:bg-zinc-800" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">
                  Satış Kanalı
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {PAYMENT_LABELS[(record as SaleRecord).method].tr}
                </span>
              </div>
            </>
          )}

          {!isSales && (
            <>
              <div className="my-3 h-px bg-gray-100 dark:bg-zinc-800" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">
                  İşlem
                </span>
                <span
                  className={`flex items-center gap-1.5 text-base font-bold ${
                    (record as TransferRecord).action === 'completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {(record as TransferRecord).action === 'completed' ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={3} />
                      Tamamlandı
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" strokeWidth={2.5} />
                      İptal Edildi
                    </>
                  )}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 dark:border-zinc-800">
          {isSales ? (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">
                Toplam Tutar
              </span>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {formatTry((record as SaleRecord).total)}
              </span>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">
                Toplam Ürün
              </span>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {(record as TransferRecord).items.reduce((s, i) => s + i.qty, 0)} adet
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-black text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-95"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/60">
      <p className="text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="text-lg font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black transition-all active:scale-95 ${
        active
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      {children}
    </button>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}
