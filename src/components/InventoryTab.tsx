import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Send,
  Truck,
  Warehouse,
  X,
  XCircle,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  COLORS,
  CRITICAL_THRESHOLD,
  PRODUCT_NAME,
  SIZES,
  WARNING_THRESHOLD,
  colorById,
  colorLabel,
  stockKey,
  type ColorId,
  type Size,
  type StockEntry,
  type Transfer,
} from '@/data';

interface InventoryTabProps {
  stock: StockEntry[];
  transfers: Transfer[];
  onCompleteBatch: (transfers: Transfer[]) => void;
  onCancelBatch: (transfers: Transfer[]) => void;
  onCreateTransfers: (transfers: Transfer[]) => void;
}

export function InventoryTab({
  stock,
  transfers,
  onCompleteBatch,
  onCancelBatch,
  onCreateTransfers,
}: InventoryTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ batch: Transfer[]; action: 'complete' | 'cancel' } | null>(null);

  const stockMap = new Map(stock.map((entry) => [stockKey(entry.color, entry.size), entry]));

  const batches = groupBatches(transfers);

  return (
    <div className="flex h-full flex-col gap-3 md:grid md:grid-cols-2 md:gap-6 md:items-start">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-100 px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            ANLIK STOK
          </p>
          <h2 className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">
            {PRODUCT_NAME}
          </h2>
        </div>

        <div className="space-y-4 px-5 py-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          <div className="md:col-span-1">
            <StockLocation
              label="Tezgah"
              icon={<Warehouse className="h-4 w-4" />}
              stockMap={stockMap}
              location="stand"
            />
          </div>
          <div className="md:col-span-1">
            <StockLocation
              label="Araç"
              icon={<Truck className="h-4 w-4" />}
              stockMap={stockMap}
              location="truck"
            />
          </div>

          <button
            onClick={() => setFormOpen(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-black text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95 md:col-span-2"
          >
            <Send className="h-5 w-5" strokeWidth={3} />
            TRANSFER OLUŞTUR
          </button>
        </div>
      </section>

      <section className="flex-1 overflow-y-auto no-scrollbar md:self-stretch">
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            Bekleyen Transferler
          </h3>
          {transfers.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              {batches.length} SEPET
            </span>
          )}
        </div>

        {transfers.length === 0 ? (
          <div className="flex min-h-[6rem] items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
            <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">
              Bekleyen transfer yok
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <BatchCard
                key={batch[0].batchId}
                batch={batch}
                onCancel={() => setConfirm({ batch, action: 'cancel' })}
                onComplete={() => setConfirm({ batch, action: 'complete' })}
              />
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <TransferFormModal
          stock={stock}
          onClose={() => setFormOpen(false)}
          onCreate={(items) => {
            onCreateTransfers(items);
            setFormOpen(false);
          }}
        />
      )}

      {confirm && (
        <TransferConfirmModal
          batch={confirm.batch}
          action={confirm.action}
          onConfirm={() => {
            if (confirm.action === 'complete') onCompleteBatch(confirm.batch);
            else onCancelBatch(confirm.batch);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function BatchCard({
  batch,
  onCancel,
  onComplete,
}: {
  batch: Transfer[];
  onCancel: () => void;
  onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalQty = batch.reduce((sum, t) => sum + t.qty, 0);
  const COLLAPSE_LIMIT = 3;
  const hasMore = batch.length > COLLAPSE_LIMIT;
  const visibleItems = expanded ? batch : batch.slice(0, COLLAPSE_LIMIT);
  const hiddenCount = batch.length - COLLAPSE_LIMIT;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
            <ArrowDownToLine className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-black text-gray-500 dark:text-zinc-400">
            {totalQty} ÜRÜN
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black tracking-wider text-gray-400 dark:text-zinc-500">
            ARAÇTAN → TEZGAHA
          </span>
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center justify-center rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label={expanded ? 'Daha az göster' : `+${hiddenCount} çeşit daha`}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {visibleItems.map((transfer) => {
          const color = colorById(transfer.color);
          return (
            <div
              key={transfer.id}
              className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-800/60"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color.swatch }}
              />
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900 dark:text-white">
                {color.label} • {transfer.size} Beden
              </p>
              <span className="shrink-0 text-sm font-black text-gray-900 dark:text-white">
                {transfer.qty}x
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button
          onClick={onCancel}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-xs font-black text-gray-600 transition hover:bg-gray-50 active:scale-95 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <XCircle className="h-4 w-4" strokeWidth={2.5} />
          İPTAL ET
        </button>
        <button
          onClick={onComplete}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95"
        >
          <Check className="h-4 w-4" strokeWidth={3} />
          TRANSFERİ BİTİR
        </button>
      </div>
    </div>
  );
}

function StockLocation({
  label,
  icon,
  stockMap,
  location,
}: {
  label: string;
  icon: ReactNode;
  stockMap: Map<string, StockEntry>;
  location: 'stand' | 'truck';
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-black text-gray-900 dark:text-white">{label}</h3>
      <div className="space-y-4">
        {COLORS.map((color) => (
          <div key={color.id}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color.swatch }}
              />
              <span className="text-sm font-black text-gray-700 dark:text-zinc-300">
                {color.label}
              </span>
              {location === 'stand' && (
                <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
              )}
              {location === 'truck' && (
                <span className="text-sky-600 dark:text-sky-400">{icon}</span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {SIZES.map((size) => {
                const entry = stockMap.get(stockKey(color.id, size));
                const value = entry?.[location] ?? 0;
                const critical = location === 'stand' && value <= CRITICAL_THRESHOLD;
                const warning = location === 'stand' && value > CRITICAL_THRESHOLD && value <= WARNING_THRESHOLD;
                return (
                  <div
                    key={`${color.id}-${size}`}
                    className={`rounded-xl border px-1 py-3 text-center ${
                      critical
                        ? 'animate-pulse-critical border-red-500 text-white'
                        : warning
                          ? 'border-[#d4d400] bg-[#f5f50a] text-gray-900'
                          : 'border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800'
                    }`}
                  >
                    <p className={`text-sm font-black ${critical ? 'text-white' : warning ? 'text-gray-900' : 'text-gray-900 dark:text-white'}`}>{size}</p>
                    <p
                      className={`mt-1 text-2xl font-black leading-none ${
                        critical ? 'text-white' : warning ? 'text-gray-900' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TransferCartItem {
  id: string;
  color: ColorId;
  size: Size;
  quantity: number;
}

function TransferFormModal({
  stock,
  onClose,
  onCreate,
}: {
  stock: StockEntry[];
  onClose: () => void;
  onCreate: (items: Transfer[]) => void;
}) {
  const [color, setColor] = useState<ColorId>('green');
  const [size, setSize] = useState<Size>('M');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<TransferCartItem[]>([]);

  useBodyScrollLock(true);

  const stockMap = new Map(stock.map((entry) => [stockKey(entry.color, entry.size), entry]));
  const currentStock = stockMap.get(stockKey(color, size))?.truck ?? 0;
  const reserved = cart
    .filter((item) => item.color === color && item.size === size)
    .reduce((sum, item) => sum + item.quantity, 0);
  const available = Math.max(0, currentStock - reserved);
  const insufficient = quantity > available;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = () => {
    if (quantity > available) return;
    setCart((current) => {
      const existing = current.find((item) => item.color === color && item.size === size);
      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...current, { id: `${color}-${size}-${Date.now()}`, color, size, quantity }];
    });
    setQuantity(1);
  };

  const createTransfers = () => {
    onCreate(
      cart.map((item) => ({
        id: item.id,
        batchId: `pending-${Date.now()}`,
        color: item.color,
        size: item.size,
        qty: item.quantity,
      })),
    );
  };

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
              YENİ TRANSFER
            </p>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              Araçtan Tezgaha
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
          <div className="space-y-4">
            <FieldGroup label="Renk Seçimi">
              <div className="grid grid-cols-2 gap-3">
                {COLORS.map((c) => (
                  <PillButton
                    key={c.id}
                    active={color === c.id}
                    onClick={() => setColor(c.id)}
                  >
                    <span
                      className="h-4 w-4 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: c.swatch }}
                    />
                    {c.label}
                  </PillButton>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Beden Seçimi">
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((s) => (
                  <PillButton
                    key={s}
                    active={size === s}
                    onClick={() => setSize(s)}
                    compact
                  >
                    {s}
                  </PillButton>
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-400 dark:text-zinc-400">
                Araçta mevcut:{' '}
                <span
                  className={
                    available < 3
                      ? 'font-bold text-red-500'
                      : 'font-bold text-gray-700 dark:text-zinc-300'
                  }
                >
                  {available}
                </span>{' '}
                adet
              </p>
            </FieldGroup>

            <div className="grid grid-cols-[1fr_1.4fr] items-end gap-3">
              <FieldGroup label="Adet">
                <div className="flex items-center gap-2">
                  <StepperButton
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" strokeWidth={3} />
                  </StepperButton>
                  <div className="flex h-12 min-w-[2.5rem] flex-1 items-center justify-center rounded-xl bg-gray-100 text-xl font-black text-gray-900 dark:bg-zinc-800 dark:text-white">
                    {quantity}
                  </div>
                  <StepperButton
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= available}
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                  </StepperButton>
                </div>
              </FieldGroup>

              <button
                onClick={addItem}
                disabled={insufficient || available === 0}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black transition-all active:scale-95 ${
                  insufficient || available === 0
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600'
                    : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600'
                }`}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
                SEPETE EKLE
              </button>
            </div>
          </div>

          <div className="my-4 h-px bg-gray-100 dark:bg-zinc-800" />

          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black tracking-wider text-gray-400 dark:text-zinc-500">
              TRANSFER SEPETİ
            </p>
            {cartCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                {cartCount} ÜRÜN
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex min-h-[5rem] items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
              <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">
                Sepet boş. Ürün ekleyin.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {colorLabel(item.color)} • {item.size} Beden
                    </p>
                    <p className="text-xs font-semibold text-gray-400 dark:text-zinc-400">
                      {item.quantity} Adet • Araçtan tezgaha
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setCart((current) =>
                        current.filter((entry) => entry.id !== item.id),
                      )
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label="Sil"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 dark:border-zinc-800">
          <button
            onClick={createTransfers}
            disabled={cart.length === 0}
            className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-black transition-all active:scale-[0.98] ${
              cart.length === 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600'
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
            }`}
          >
            <Send className="h-5 w-5" strokeWidth={3} />
            TRANSFERİ OLUŞTUR
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferConfirmModal({
  batch,
  action,
  onConfirm,
  onCancel,
}: {
  batch: Transfer[];
  action: 'complete' | 'cancel';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isComplete = action === 'complete';
  const totalQty = batch.reduce((sum, t) => sum + t.qty, 0);

  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="animate-modal-in relative m-4 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-5 py-5 text-center">
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
              isComplete
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
            }`}
          >
            {isComplete ? (
              <Check className="h-7 w-7" strokeWidth={3} />
            ) : (
              <XCircle className="h-7 w-7" strokeWidth={2.5} />
            )}
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {isComplete ? 'Transferi Tamamlıyor musunuz?' : 'Transferi İptal Ediyor musunuz?'}
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-gray-400 dark:text-zinc-400">
            {batch.length} çeşit · {totalQty} ürün
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
            {isComplete
              ? 'Tüm ürünler tezgaha eklenecek.'
              : 'Tüm ürünler araçtaki stoklara geri eklenecek.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="h-14 rounded-2xl border border-gray-200 text-base font-black text-gray-700 transition active:scale-95 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className={`h-14 rounded-2xl text-base font-black text-white transition active:scale-95 ${
              isComplete
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600'
                : 'bg-red-500 shadow-lg shadow-red-500/25 hover:bg-red-600'
            }`}
          >
            {isComplete ? 'Evet, Bitir' : 'Evet, İptal Et'}
          </button>
        </div>
      </div>
    </div>
  );
}

function groupBatches(transfers: Transfer[]): Transfer[][] {
  const map = new Map<string, Transfer[]>();
  for (const t of transfers) {
    const list = map.get(t.batchId) ?? [];
    list.push(t);
    map.set(t.batchId, list);
  }
  return Array.from(map.values());
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-black text-gray-900 dark:text-white">{label}</h3>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border font-bold transition-all active:scale-95 ${
        compact ? 'py-2.5 text-sm' : 'py-3 text-base'
      } ${
        active
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      {children}
    </button>
  );
}

function StepperButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
          : 'border-gray-200 bg-white text-gray-900 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:border-emerald-500'
      }`}
    >
      {children}
    </button>
  );
}
