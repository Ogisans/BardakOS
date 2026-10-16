import { DEMO_SIZE_SALES, DEMO_COLOR_SALES } from '@/demo/dashboard';
import { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  Palette,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  colorLabel,
  colorById,
  PRODUCT_NAME,
  CRITICAL_THRESHOLD,
  type StockEntry,
  type SaleRecord,
  type Size,
  type ColorId,
  SIZES,
} from '@/data';

interface StockAnalyticsTabProps {
  stock: StockEntry[];
  salesHistory: SaleRecord[];
}

export function StockAnalyticsTab({ stock, salesHistory }: StockAnalyticsTabProps) {
  const [selectedColorFilter, setSelectedColorFilter] = useState<'all' | ColorId | 'critical'>('all');
  const [hoveredSize, setHoveredSize] = useState<Size | null>(null);

  // Total stock units
  const totalStockUnits = useMemo(() => {
    return stock.reduce((sum, item) => sum + item.truck + item.stand, 0);
  }, [stock]);

  // Critical stock variants (shared threshold, total units)
  const criticalVariants = useMemo(() => {
    return stock.filter((item) => item.truck + item.stand <= CRITICAL_THRESHOLD);
  }, [stock]);

  // Size sales distribution (baseline + live sales)
  const sizeDistribution = useMemo(() => {
    // Base baseline sales counts
    const counts: Record<Size, number> = { ...DEMO_SIZE_SALES };

    // Add live sales
    for (const sale of salesHistory) {
      for (const item of sale.items) {
        if (counts[item.size] !== undefined) {
          counts[item.size] += item.quantity;
        }
      }
    }

    const totalSold = Object.values(counts).reduce((a, b) => a + b, 0);
    const maxSold = Math.max(...Object.values(counts));

    return SIZES.map((size) => {
      const count = counts[size];
      const share = totalSold > 0 ? ((count / totalSold) * 100).toFixed(1) : '0';
      return {
        size,
        count,
        share,
        heightPct: maxSold > 0 ? Math.round((count / maxSold) * 100) : 0,
      };
    });
  }, [salesHistory]);

  // Color sales distribution (Green vs White)
  const colorDistribution = useMemo(() => {
    let greenSold = DEMO_COLOR_SALES.green;
    let whiteSold = DEMO_COLOR_SALES.white;

    for (const sale of salesHistory) {
      for (const item of sale.items) {
        if (item.color === 'green') greenSold += item.quantity;
        else if (item.color === 'white') whiteSold += item.quantity;
      }
    }

    const total = greenSold + whiteSold;
    const greenShare = total > 0 ? Number(((greenSold / total) * 100).toFixed(1)) : 62;
    const whiteShare = total > 0 ? Number(((whiteSold / total) * 100).toFixed(1)) : 38;

    // Remaining stocks for both colors
    const greenStock = stock
      .filter((s) => s.color === 'green')
      .reduce((sum, s) => sum + s.truck + s.stand, 0);
    const whiteStock = stock
      .filter((s) => s.color === 'white')
      .reduce((sum, s) => sum + s.truck + s.stand, 0);

    return {
      greenSold,
      whiteSold,
      totalSold: total,
      greenShare,
      whiteShare,
      greenStock,
      whiteStock,
    };
  }, [salesHistory, stock]);

  // Best selling size & color
  const bestSize = useMemo(() => {
    return [...sizeDistribution].sort((a, b) => b.count - a.count)[0];
  }, [sizeDistribution]);

  // Filtered stock list for the table
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      if (selectedColorFilter === 'critical') {
        return item.truck + item.stand <= CRITICAL_THRESHOLD;
      }
      if (selectedColorFilter === 'all') {
        return true;
      }
      return item.color === selectedColorFilter;
    });
  }, [stock, selectedColorFilter]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Sub Header & Collection Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Stok
            </p>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
            Stok ve Analiz
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-600 dark:text-zinc-300 shadow-sm">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <span>{PRODUCT_NAME} · Saha stoku</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Toplam Stok */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Boxes className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Toplam Stok
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Genel Mevcut
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              Canlı
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {totalStockUnits} adet
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              Genel mevcut stok
            </p>
          </div>
        </div>

        {/* Card 2: Kritik Stok Uyarıları */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Kritik Stok
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Kritik (≤{CRITICAL_THRESHOLD} adet)
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20">
              {criticalVariants.length > 0 ? 'İkmal Gerekli' : 'Güvenli'}
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {criticalVariants.length} varyant
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              Stok tükenme riski taşıyanlar
            </p>
          </div>
        </div>

        {/* Card 3: En Çok Satan Beden */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Lider Beden
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  En Çok Satan
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              <ArrowUpRight className="h-3 w-3" />
              %{bestSize?.share}
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {bestSize?.size} Beden
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              {bestSize?.count} adet toplam satış
            </p>
          </div>
        </div>

        {/* Card 4: En Çok Satan Renk */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Palette className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Lider Renk
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  En Çok Tercih
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              %{colorDistribution.greenShare}
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {colorLabel('green')}
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              {colorDistribution.greenSold} adet toplam satış
            </p>
          </div>
        </div>
      </div>

      {/* Orta Bölüm: Grafikler (Beden Performansı & Renk Karşılaştırması) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Beden Performansı Sütun Grafiği (3 cols on lg) */}
        <div className="lg:col-span-3 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                Talep Analizi
              </p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                Beden Bazlı Satış Performansı
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400">
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>Tüm Kanallar</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mt-6">
            <div className="flex h-56 items-end justify-between gap-3 sm:gap-6 pt-8 px-2">
              {sizeDistribution.map((item) => {
                const isHovered = hoveredSize === item.size;
                const isLeader = item.size === bestSize?.size;

                return (
                  <div
                    key={item.size}
                    className="relative flex flex-1 flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredSize(item.size)}
                    onMouseLeave={() => setHoveredSize(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 whitespace-nowrap rounded-2xl bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xl dark:bg-white dark:text-zinc-900 animate-toast-in">
                        <p className="font-black text-xs">{item.size} Beden</p>
                        <p className="text-emerald-400 dark:text-emerald-600">
                          {item.count} adet (%{item.share})
                        </p>
                      </div>
                    )}

                    {/* Bar */}
                    <div className="w-full max-w-[56px] flex items-end justify-center h-full">
                      <div
                        style={{ height: `${Math.max(16, item.heightPct)}%` }}
                        className={`w-full rounded-t-xl transition-all duration-300 group-hover:brightness-110 ${
                          isLeader
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-gradient-to-t from-zinc-400 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600'
                        }`}
                      />
                    </div>

                    {/* Size Label */}
                    <div className="mt-3 text-center">
                      <span
                        className={`inline-block rounded-lg px-2 py-0.5 text-xs font-black transition ${
                          isLeader
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'text-gray-700 dark:text-zinc-300'
                        }`}
                      >
                        {item.size}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Insight */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs font-medium text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-white">En Çok Tercih:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {bestSize?.size} Beden ({bestSize?.count} Adet)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-white">Ortalama Beden Satışı:</span>
                <span>{Math.round(sizeDistribution.reduce((sum, s) => sum + s.count, 0) / SIZES.length)} adet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Renk Karşılaştırması (2 cols on lg) */}
        <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                Renk Popülaritesi
              </p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                Renk tercihleri
              </h3>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-lg">
              <Sparkles className="h-3.5 w-3.5" />
              Trend
            </span>
          </div>

          {/* Donut / Circular Graphic Visual */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* SVG Doughnut */}
              <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background circle / White share */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                  strokeWidth="11"
                  fill="transparent"
                />
                {/* Green share arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-emerald-500 transition-all duration-700"
                  strokeWidth="11"
                  fill="transparent"
                  strokeDasharray={`${(colorDistribution.greenShare / 100) * 238.76} 238.76`}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  %{colorDistribution.greenShare}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  {colorLabel('green')} payı
                </span>
              </div>
            </div>
          </div>

          {/* Color Breakdown Cards */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* Green Card */}
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-600 border border-white shadow-sm" />
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {colorLabel('green')}
                </p>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  %{colorDistribution.greenShare}
                </p>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                  {colorDistribution.greenSold} satış
                </p>
              </div>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">
                Kalan Stok: {colorDistribution.greenStock} adet
              </p>
            </div>

            {/* White Card */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-white border border-gray-300 dark:border-zinc-600 shadow-sm" />
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {colorLabel('white')}
                </p>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  %{colorDistribution.whiteShare}
                </p>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                  {colorDistribution.whiteSold} satış
                </p>
              </div>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">
                Kalan Stok: {colorDistribution.whiteStock} adet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Bölüm: Detaylı Stok Tablosu */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Table Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Envanter Listesi
            </p>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
              Varyant Bazlı Stok Durumu
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setSelectedColorFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedColorFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Tümü ({stock.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedColorFilter('green')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedColorFilter === 'green'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-emerald-300'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{colorLabel('green')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedColorFilter('white')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedColorFilter === 'white'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-white border border-gray-400" />
              <span>{colorLabel('white')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedColorFilter('critical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedColorFilter === 'critical'
                  ? 'bg-white text-rose-700 shadow-sm dark:bg-zinc-700 dark:text-rose-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Kritikler ({criticalVariants.length})</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500">
                <th className="py-3.5 px-6">Ürün Adı</th>
                <th className="py-3.5 px-6">Renk</th>
                <th className="py-3.5 px-6">Beden</th>
                <th className="py-3.5 px-6 text-center">Toplam Stok</th>
                <th className="py-3.5 px-6 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80 font-medium">
              {filteredStock.map((item) => {
                const totalUnits = item.truck + item.stand;
                const isCritical = totalUnits <= CRITICAL_THRESHOLD;

                return (
                  <tr
                    key={`${item.color}-${item.size}`}
                    className="transition hover:bg-gray-50/80 dark:hover:bg-zinc-800/50"
                  >
                    {/* Ürün Adı */}
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                      {PRODUCT_NAME}
                    </td>

                    {/* Renk */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-black/10 shadow-sm dark:border-white/20"
                          style={{ backgroundColor: colorById(item.color).swatch }}
                        />
                        <span className="font-bold text-gray-800 dark:text-zinc-200">
                          {colorLabel(item.color)}
                        </span>
                      </div>
                    </td>

                    {/* Beden */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-lg bg-gray-100 font-black text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.size}
                      </span>
                    </td>

                    {/* Toplam Stok */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`text-sm font-black ${
                          isCritical
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {totalUnits} adet
                      </span>
                    </td>

                    {/* Durum Badge */}
                    <td className="py-4 px-6 text-right">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Kritik</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Yeterli</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
