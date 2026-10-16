import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import {
  COLORS,
  PRODUCT_NAME,
  SIZES,
  colorLabel,
  formatTry,
  stockKey,
  type CartItem,
  type ColorId,
  type PaymentMethod,
  type Size,
  type StockEntry,
} from '@/data';

interface SalesTabProps {
  stock: StockEntry[];
  color: ColorId;
  size: Size;
  qty: number;
  method: PaymentMethod;
  cart: CartItem[];
  onColorChange: (c: ColorId) => void;
  onSizeChange: (s: Size) => void;
  onQtyChange: (q: number) => void;
  onMethodChange: (m: PaymentMethod) => void;
  onAddToCart: () => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function SalesTab(props: SalesTabProps) {
  const {
    stock,
    color,
    size,
    qty,
    method,
    cart,
    onColorChange,
    onSizeChange,
    onQtyChange,
    onMethodChange,
    onAddToCart,
    onRemoveFromCart,
    onClearCart,
    onCheckout,
  } = props;

  const stockMap = new Map(stock.map((s) => [stockKey(s.color, s.size), s]));
  const current = stockMap.get(stockKey(color, size));
  const standStock = current?.stand ?? 0;
  const reservedQuantity = cart
    .filter((item) => item.color === color && item.size === size)
    .reduce((sum, item) => sum + item.quantity, 0);
  const availableStock = Math.max(0, standStock - reservedQuantity);
  const insufficient = qty > availableStock;

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col gap-3 md:flex md:flex-row md:items-start md:gap-4">
      {/* Top: Product selection */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between md:flex-1 md:min-w-0">
        <div className="border-b border-gray-100 px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            YENİ SATIŞ
          </p>
          <h2 className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">
            {PRODUCT_NAME}
          </h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          <FieldGroup label="Renk Seçimi">
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((c) => (
                <PillButton
                  key={c.id}
                  active={color === c.id}
                  onClick={() => onColorChange(c.id)}
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
                  onClick={() => onSizeChange(s)}
                  compact
                >
                  {s}
                </PillButton>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-gray-400 dark:text-zinc-400">
              Stok: <span className={availableStock < 3 ? 'font-bold text-red-500' : 'font-bold text-gray-700 dark:text-zinc-300'}>{availableStock}</span> adet
            </p>
          </FieldGroup>

          <div className="grid grid-cols-[1fr_1.4fr] items-end gap-3">
            <FieldGroup label="Adet">
              <div className="flex items-center gap-2">
                <StepperButton onClick={() => onQtyChange(Math.max(1, qty - 1))} disabled={qty <= 1}>
                  <Minus className="h-4 w-4" strokeWidth={3} />
                </StepperButton>
                <div className="flex h-12 min-w-[2.5rem] flex-1 items-center justify-center rounded-xl bg-gray-100 text-xl font-black text-gray-900 dark:bg-zinc-800 dark:text-white">
                  {qty}
                </div>
                <StepperButton onClick={() => onQtyChange(qty + 1)} disabled={qty >= availableStock}>
                  <Plus className="h-4 w-4" strokeWidth={3} />
                </StepperButton>
              </div>
            </FieldGroup>

            <button
              onClick={onAddToCart}
              disabled={insufficient}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black transition-all active:scale-95 ${
                insufficient
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600'
                  : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600'
              }`}
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              SEPETE EKLE
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 md:flex md:flex-col md:self-stretch md:flex-1 md:min-w-0 md:h-full md:justify-between">
        {/* Middle: Cart list (scrollable) */}
        <section className="flex-1 overflow-y-auto no-scrollbar md:order-2 md:flex-grow md:min-h-0 md:overflow-y-auto md:max-h-none">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-gray-900 dark:text-white">Sepet</h3>
            {cartCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                {cartCount} ÜRÜN
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex h-full min-h-[6rem] md:min-h-0 md:h-12 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700 md:py-1">
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
                      {item.quantity} Adet • {formatTry(item.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom: Checkout (sticky) */}
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:order-1 md:flex-shrink-0">
          <div className="mb-3">
            <h3 className="mb-2 text-sm font-black text-gray-900 dark:text-white">
              Satış Kanalı
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <PillButton active={method === 'cash'} onClick={() => onMethodChange('cash')} compact>
                <span className="whitespace-nowrap">Nakit</span>
              </PillButton>
              <PillButton active={method === 'iban'} onClick={() => onMethodChange('iban')} compact>
                <span className="whitespace-nowrap">IBAN</span>
              </PillButton>
              <PillButton active={method === 'shopier'} onClick={() => onMethodChange('shopier')} compact>
                <span className="whitespace-nowrap">Shopier</span>
              </PillButton>
            </div>
          </div>

          <div className="mb-3 flex items-end justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/60">
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-400 dark:text-zinc-400">
                TOPLAM TUTAR
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                {cartCount} ürün
              </p>
            </div>
            <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {formatTry(cartTotal)}
            </p>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button
              onClick={onClearCart}
              disabled={cart.length === 0}
              className={`flex h-14 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-black transition active:scale-95 ${
                cart.length === 0
                  ? 'cursor-not-allowed bg-gray-100 text-gray-300 dark:bg-zinc-800 dark:text-zinc-600'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.5} />
              TEMİZLE
            </button>
            <button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-black transition-all active:scale-[0.98] ${
                cart.length === 0
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600'
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
              }`}
            >
              <Check className="h-6 w-6" strokeWidth={3} />
              SATIŞI TAMAMLA
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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
