import { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Boxes,
  ArrowUpRight,
  Receipt,
  Calendar,
  ArrowRightLeft,
  DollarSign,
  Activity,
  ChevronDown,
  Check,
  X,
  Clock,
  Tag,
} from 'lucide-react';
import {
  formatTry,
  UNIT_PRICE,
  type StockEntry,
  type SaleRecord,
  type TransferRecord,
} from '@/data';
import { DEMO_SALES_BASELINE, DEMO_WEEKLY_SALES } from '@/demo/dashboard';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { getRecentOperations, type OperationDetail } from '@/features/management/recentOperations';

interface DashboardTabProps {
  stock: StockEntry[];
  salesHistory: SaleRecord[];
  transferHistory: TransferRecord[];
}

type TimeFilter = 'today' | 'month' | 'all';

export function DashboardTab({
  stock,
  salesHistory,
  transferHistory,
}: DashboardTabProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [selectedOp, setSelectedOp] = useState<OperationDetail | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(Boolean(selectedOp));

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  // Close modal on ESC key
  useEffect(() => {
    if (!selectedOp) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOp(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOp]);

  // Calculate live stock values
  const stockStats = useMemo(() => {
    const truck = stock.reduce((sum, item) => sum + item.truck, 0);
    const stand = stock.reduce((sum, item) => sum + item.stand, 0);
    const total = truck + stand;
    const value = total * UNIT_PRICE;
    return { truck, stand, total, value };
  }, [stock]);

  // Live sales calculations
  const liveSalesStats = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneMonthMs = 30 * oneDayMs;

    const liveToday = salesHistory.filter((s) => now - s.timestamp <= oneDayMs);
    const liveMonth = salesHistory.filter((s) => now - s.timestamp <= oneMonthMs);

    const calcSum = (list: SaleRecord[]) => ({
      count: list.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0),
      revenue: list.reduce((sum, s) => sum + s.total, 0),
    });

    return {
      today: calcSum(liveToday),
      month: calcSum(liveMonth),
      all: calcSum(salesHistory),
    };
  }, [salesHistory]);

  // Baseline data + live sales (ensures rich display upon demo load)
  const salesStats = useMemo(() => {
    const baseline = DEMO_SALES_BASELINE;

    return {
      count: baseline[timeFilter].count + liveSalesStats[timeFilter].count,
      revenue: baseline[timeFilter].revenue + liveSalesStats[timeFilter].revenue,
    };
  }, [timeFilter, liveSalesStats]);

  // 7-day sales trend mock data + live today adjustment
  const weeklyData = useMemo(() => {
    const days = [...DEMO_WEEKLY_SALES, { day: 'Paz', date: 'Bugün', count: DEMO_SALES_BASELINE.today.count + liveSalesStats.today.count, revenue: DEMO_SALES_BASELINE.today.revenue + liveSalesStats.today.revenue }];

    const maxRev = Math.max(...days.map((d) => d.revenue), 32000);
    return { days, maxRev };
  }, [liveSalesStats]);

  const recentOperations = useMemo(
    () => getRecentOperations(salesHistory, transferHistory),
    [salesHistory, transferHistory],
  );

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Sub Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Dashboard
            </p>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
            Genel Bakış
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-600 dark:text-zinc-300 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>Bugün, {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Card 1: Satış ve Ciro */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Satış ve Ciro
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                  {timeFilter === 'today' ? 'Bugünkü Satışlar' : timeFilter === 'month' ? 'Bu Ayki Satışlar' : 'Toplam Satış Performansı'}
                </p>
              </div>
            </div>

            {/* Custom Tailwind Time Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                aria-expanded={filterOpen}
                aria-haspopup="listbox"
              >
                <span>
                  {timeFilter === 'today' ? 'Bugün' : timeFilter === 'month' ? 'Bu Ay' : 'Toplam'}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 dark:text-zinc-400 ${
                    filterOpen ? 'rotate-180 text-emerald-500' : ''
                  }`}
                />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 z-30 min-w-[130px] overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95 animate-modal-in">
                  {(
                    [
                      { id: 'today', label: 'Bugün' },
                      { id: 'month', label: 'Bu Ay' },
                      { id: 'all', label: 'Toplam' },
                    ] as const
                  ).map((opt) => {
                    const isSelected = timeFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt.id);
                          setFilterOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/70'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-t border-gray-100 pt-5 dark:border-zinc-800">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">
                Toplam Ciro
              </p>
              <p className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mt-1">
                {formatTry(salesStats.revenue)}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-2.5 text-right dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800/60">
              <p className="text-xs font-medium text-gray-400 dark:text-zinc-400">
                Satılan Ürün
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <Receipt className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {salesStats.count} <span className="text-xs font-normal text-gray-500 dark:text-zinc-400">adet</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="h-4 w-4" />
              <span>Birim Fiyat: {formatTry(UNIT_PRICE)}</span>
            </div>
            <span>
              Ort. Sepet: {formatTry(salesStats.count > 0 ? Math.round(salesStats.revenue / salesStats.count) : UNIT_PRICE)}
            </span>
          </div>
        </div>

        {/* Card 2: Toplam Stok (Sadeleştirilmiş - Ferah Görünüm) */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Boxes className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Toplam Stok
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                  Tüm Envanter
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Depo Aktif
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-t border-gray-100 pt-5 dark:border-zinc-800">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">
                Mevcut Stok Adedi
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  {stockStats.total}
                </span>
                <span className="text-sm font-bold text-gray-500 dark:text-zinc-400">adet ürün</span>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-2.5 text-right dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800/60">
              <p className="text-xs font-medium text-gray-400 dark:text-zinc-400">
                Tahmini Stok Değeri
              </p>
              <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                {formatTry(stockStats.value)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 7-Day Trend Chart (Takes 2 columns on lg screens) */}
        <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                Satış Hacmi
              </p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                Son 7 Günlük Satış Trendi
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                <span className="h-3 w-3 rounded-md bg-emerald-500" />
                <span>Günlük Ciro</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="mt-6">
            <div className="flex h-56 items-end justify-between gap-2 sm:gap-4 pt-8 px-1">
              {weeklyData.days.map((item, idx) => {
                const heightPercent = Math.max(14, Math.round((item.revenue / weeklyData.maxRev) * 100));
                const isHovered = hoveredBarIndex === idx;
                const isToday = idx === weeklyData.days.length - 1;

                return (
                  <div
                    key={item.day}
                    className="relative flex flex-1 flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 whitespace-nowrap rounded-xl bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl dark:bg-white dark:text-zinc-900 animate-toast-in">
                        <p className="leading-tight">{formatTry(item.revenue)}</p>
                        <p className="text-[10px] font-medium opacity-80">{item.count} adet · {item.date}</p>
                      </div>
                    )}

                    {/* Bar visual */}
                    <div className="w-full max-w-[48px] rounded-t-xl bg-gray-100 dark:bg-zinc-800/70 p-1 flex flex-col justify-end h-full overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-gradient-to-t from-emerald-700/80 to-emerald-500/90 dark:from-emerald-600/70 dark:to-emerald-400/80 group-hover:from-emerald-500 group-hover:to-emerald-400'
                        }`}
                      />
                    </div>

                    {/* Axis Labels */}
                    <div className="mt-3 text-center">
                      <p className={`text-xs font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'}`}>
                        {item.day}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 hidden sm:block">
                        {item.date}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Footer Summary */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs font-medium text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white">Haftalık Toplam:</span>
                <span>{formatTry(weeklyData.days.reduce((sum, d) => sum + d.revenue, 0))}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white">Günlük Ortalama:</span>
                <span>{formatTry(Math.round(weeklyData.days.reduce((sum, d) => sum + d.revenue, 0) / 7))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions (Takes 1 column on lg screens - Clickable with Modal) */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                Hareketler
              </p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                Son İşlemler
              </h3>
            </div>
            <Activity className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          </div>

          <div className="mt-4 flex flex-col divide-y divide-gray-100 dark:divide-zinc-800/80">
            {recentOperations.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setSelectedOp(op)}
                className="group flex w-full items-center justify-between py-3.5 px-2 -mx-2 rounded-2xl transition hover:bg-gray-50 dark:hover:bg-zinc-800/60 active:scale-[0.99] text-left cursor-pointer"
                title="Detayları görüntülemek için tıklayın"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${
                      op.type === 'sale'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                    }`}
                  >
                    {op.type === 'sale' ? (
                      <DollarSign className="h-5 w-5" strokeWidth={2.4} />
                    ) : (
                      <ArrowRightLeft className="h-5 w-5" strokeWidth={2.4} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {op.title}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-zinc-400">
                      {op.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p className="text-sm font-black text-gray-900 dark:text-white">
                    {op.amount}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${op.badgeColor}`}>
                      {op.badge}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {op.time}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operation Detail Modal */}
      {selectedOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOp(null)}
          />
          <div className="animate-modal-in relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    selectedOp.type === 'sale'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400'
                  }`}
                >
                  {selectedOp.type === 'sale' ? (
                    <DollarSign className="h-5 w-5" strokeWidth={2.4} />
                  ) : (
                    <ArrowRightLeft className="h-5 w-5" strokeWidth={2.4} />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-emerald-600 dark:text-emerald-400 uppercase">
                    {selectedOp.type === 'sale' ? 'Satış Detayı' : 'Transfer Detayı'}
                  </p>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">
                    {selectedOp.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedOp(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-4">
              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>Zaman</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-gray-800 dark:text-zinc-200">
                    {selectedOp.dateStr}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    <Tag className="h-3 w-3" />
                    <span>{selectedOp.type === 'sale' ? 'Kanal' : 'Durum'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${selectedOp.badgeColor}`}>
                      {selectedOp.badge}
                    </span>
                    <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">
                      {selectedOp.methodLabel || (selectedOp.transferAction === 'completed' ? 'Tamamlandı' : 'İptal')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  {selectedOp.type === 'sale' ? 'Satılan Ürünler' : 'Transfer Edilen Ürünler'}
                </p>
                <div className="space-y-2">
                  {selectedOp.type === 'sale' &&
                    selectedOp.items?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 px-3.5 py-2.5 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800/70"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 dark:border-white/20"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                              {item.color} · Beden: {item.size} · {item.quantity} Adet
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-gray-900 dark:text-white shrink-0 pl-2">
                          {formatTry(item.price ?? 0)}
                        </p>
                      </div>
                    ))}

                  {selectedOp.type === 'transfer' &&
                    selectedOp.items?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 px-3.5 py-2.5 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800/70"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 dark:border-white/20"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                              {item.color} · Beden: {item.size}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                          {item.qty} Adet
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Summary Box */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-200/70 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/70">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    {selectedOp.type === 'sale' ? 'Toplam Tutar' : 'Toplam Miktar'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {selectedOp.type === 'sale' ? 'Tahsilat tamamlandı' : 'Stok tezgahta hazır'}
                  </p>
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {selectedOp.type === 'sale'
                    ? formatTry(selectedOp.total ?? 0)
                    : `${selectedOp.totalQty ?? 0} Adet`}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 dark:border-zinc-800">
              <button
                onClick={() => setSelectedOp(null)}
                className="w-full rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
