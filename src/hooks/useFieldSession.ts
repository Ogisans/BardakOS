import { useCallback, useRef, useState } from 'react';
import type { ToastItem } from '@/components/Toast';
import {
  INITIAL_STOCK, INITIAL_TRANSFERS, UNIT_PRICE, colorLabel, formatTry,
  type CartItem, type ColorId, type SaleRecord, type TransferRecord,
  type PaymentMethod, type Size, type StockEntry, type Transfer,
} from '@/data';
import { applySaleToStock, applyTransferToStock } from '@/domain/stock';

interface PendingSale {
  items: CartItem[];
  method: PaymentMethod;
  total: number;
}

// Session-only field operations. App owns the hook so navigation does not reset records.
export function useFieldSession() {
  const [color, setColor] = useState<ColorId>('green');
  const [size, setSize] = useState<Size>('M');
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stock, setStock] = useState<StockEntry[]>(INITIAL_STOCK);
  const [transfers, setTransfers] = useState<Transfer[]>(INITIAL_TRANSFERS);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [startingCash, setStartingCash] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState<PendingSale | null>(null);
  const lastSale = useRef<PendingSale | null>(null);
  const lastUndoId = useRef<number | null>(null);

  const showToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts((current) => [...current, { ...item, id: Date.now() + Math.random() }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const handleAddToCart = useCallback(() => {
    const itemPrice = qty * UNIT_PRICE;
    setCart((current) => {
      const existing = current.find((item) => item.color === color && item.size === size);
      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + qty, price: item.price + itemPrice }
            : item,
        );
      }
      return [
        ...current,
        {
          id: `${color}-${size}-${Date.now()}`,
          color,
          size,
          quantity: qty,
          price: itemPrice,
        },
      ];
    });
    setQty(1);
    showToast({
      message: 'Sepete Eklendi',
      sub: `${colorLabel(color)} · ${size} · ${qty} Adet`,
    });
  }, [color, size, qty, showToast]);

  const handleRemoveFromCart = useCallback((id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setPendingSale({
      items: cart.map((item) => ({ ...item })),
      method,
      total: cart.reduce((sum, item) => sum + item.price, 0),
    });
    setModalOpen(true);
  }, [cart, method]);

  const handleConfirm = useCallback(() => {
    if (!pendingSale) return;

    setStock((current) => applySaleToStock(current, pendingSale.items));

    const undoId = Date.now();
    setSalesHistory((current) => [
      ...current,
      {
        id: `sale-${undoId}`,
        timestamp: undoId,
        items: pendingSale.items.map((item) => ({ ...item })),
        method: pendingSale.method,
        total: pendingSale.total,
      },
    ]);
    lastSale.current = pendingSale;
    lastUndoId.current = undoId;
    setCart([]);
    setPendingSale(null);
    setModalOpen(false);
    showToast({
      message: 'Satış Kaydedildi',
      sub: `${pendingSale.items.length} çeşit · ${formatTry(pendingSale.total)}`,
      undoId,
    });
  }, [pendingSale, showToast]);

  const handleUndo = useCallback(
    (undoId: number) => {
      if (!lastSale.current || lastUndoId.current !== undoId) return;
      const sale = lastSale.current;
      setStock((current) => applySaleToStock(current, sale.items, true));
      setSalesHistory((current) => current.filter((entry) => entry.id !== `sale-${undoId}`));
      lastSale.current = null;
      lastUndoId.current = null;
      showToast({ message: 'Satış Geri Alındı', sub: 'Stok geri yüklendi' });
    },
    [showToast],
  );

  const handleCreateTransfers = useCallback(
    (newTransfers: Transfer[]) => {
      const batchId = `batch-${Date.now()}`;
      const batched = newTransfers.map((t, i) => ({
        ...t,
        id: `${batchId}-${i}`,
        batchId,
      }));
      setStock((current) => applyTransferToStock(current, batched, 'create'));
      setTransfers((current) => [...current, ...batched]);
      showToast({
        message: 'Transfer Oluşturuldu',
        sub: `${batched.length} çeşit araçtan düşüldü`,
      });
    },
    [showToast],
  );

  const handleCompleteBatch = useCallback(
    (batchTransfers: Transfer[]) => {
      setStock((current) => applyTransferToStock(current, batchTransfers, 'complete'));
      const ids = new Set(batchTransfers.map((t) => t.id));
      setTransfers((current) => current.filter((item) => !ids.has(item.id)));
      setTransferHistory((current) => [
        ...current,
        {
          id: `transfer-completed-${Date.now()}`,
          batchId: batchTransfers[0]?.batchId ?? '',
          timestamp: Date.now(),
          items: batchTransfers.map(({ color, size, qty }) => ({ color, size, qty })),
          action: 'completed',
        },
      ]);
      const totalQty = batchTransfers.reduce((sum, t) => sum + t.qty, 0);
      showToast({
        message: 'Transfer Tamamlandı',
        sub: `${totalQty}x ürün → tezgah`,
      });
    },
    [showToast],
  );

  const handleCancelBatch = useCallback(
    (batchTransfers: Transfer[]) => {
      setStock((current) => applyTransferToStock(current, batchTransfers, 'cancel'));
      const ids = new Set(batchTransfers.map((t) => t.id));
      setTransfers((current) => current.filter((item) => !ids.has(item.id)));
      setTransferHistory((current) => [
        ...current,
        {
          id: `transfer-canceled-${Date.now()}`,
          batchId: batchTransfers[0]?.batchId ?? '',
          timestamp: Date.now(),
          items: batchTransfers.map(({ color, size, qty }) => ({ color, size, qty })),
          action: 'canceled',
        },
      ]);
      const totalQty = batchTransfers.reduce((sum, t) => sum + t.qty, 0);
      showToast({
        message: 'Transfer İptal Edildi',
        sub: `${totalQty}x ürün → araca iade`,
      });
    },
    [showToast],
  );

  return {
    color,
    setColor,
    size,
    setSize,
    qty,
    setQty,
    method,
    setMethod,
    cart,
    stock,
    transfers,
    salesHistory,
    transferHistory,
    startingCash,
    setStartingCash,
    toasts,
    modalOpen,
    setModalOpen,
    pendingSale,
    dismissToast,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleCheckout,
    handleConfirm,
    handleUndo,
    handleCreateTransfers,
    handleCompleteBatch,
    handleCancelBatch,
  };
}
