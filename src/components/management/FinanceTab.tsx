import { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Building2,
  Globe,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  X,
  Receipt,
  Calendar,
  ChevronDown,
  Check,
  Clock,
  Tag,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import {
  formatTry,
  type SaleRecord,
} from '@/data';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { ExpenseItem } from '@/types/management';
import { DEMO_CHANNEL_REVENUE, DEMO_CHANNEL_COUNTS, DEMO_STARTING_CASH, DEMO_MONTHLY_FLOW } from '@/demo/finance';
import { parseExpenseAmount } from '@/domain/money';

interface FinanceTabProps {
  salesHistory: SaleRecord[];
  expenses: ExpenseItem[];
  onAddExpense: (expense: ExpenseItem) => void;
}

const CATEGORIES: ExpenseItem['category'][] = [
  'Hammadde',
  'İşçilik',
  'Lojistik',
  'İşletme',
  'Pazarlama',
];

const CHANNELS: ExpenseItem['channel'][] = [
  'Banka Transferi',
  'Kredi Kartı',
  'Nakit',
];

export function FinanceTab({ salesHistory, expenses, onAddExpense }: FinanceTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllExpensesModalOpen, setIsAllExpensesModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Form state for adding expense
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseItem['category']>('Hammadde');
  const [newAmount, setNewAmount] = useState('');
  const [newChannel, setNewChannel] = useState<ExpenseItem['channel']>('Banka Transferi');

  // Dropdown open states and refs
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isModalOpen || isAllExpensesModalOpen || Boolean(selectedExpense));

  // Category badge style helper
  const getCategoryBadgeClass = (category: ExpenseItem['category']) => {
    switch (category) {
      case 'Hammadde':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
      case 'İşçilik':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
      case 'Lojistik':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300';
      case 'İşletme':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'Pazarlama':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  // Close modals on ESC
  useEffect(() => {
    if (!isModalOpen && !isAllExpensesModalOpen && !selectedExpense) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedExpense) {
          setSelectedExpense(null);
        } else if (isAllExpensesModalOpen) {
          setIsAllExpensesModalOpen(false);
        } else if (isModalOpen) {
          setIsModalOpen(false);
          setCategoryOpen(false);
          setChannelOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isAllExpensesModalOpen, selectedExpense]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!categoryOpen && !channelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
      if (channelRef.current && !channelRef.current.contains(e.target as Node)) {
        setChannelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryOpen, channelOpen]);

  // Live sales by payment channel
  const liveChannelRevenue = useMemo(() => {
    let cash = 0;
    let shopier = 0;
    let iban = 0;

    for (const sale of salesHistory) {
      if (sale.method === 'cash') cash += sale.total;
      else if (sale.method === 'shopier') shopier += sale.total;
      else if (sale.method === 'iban') iban += sale.total;
    }

    return { cash, shopier, iban, total: cash + shopier + iban };
  }, [salesHistory]);

  // Combined totals (Baseline demo + live)
  const financialSummary = useMemo(() => {
    const baselineRevenue = DEMO_CHANNEL_REVENUE;

    const totalCash = baselineRevenue.cash + liveChannelRevenue.cash;
    const totalShopier = baselineRevenue.shopier + liveChannelRevenue.shopier;
    const totalIban = baselineRevenue.iban + liveChannelRevenue.iban;
    const grossRevenue = totalCash + totalShopier + totalIban;

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = grossRevenue - totalExpense;
    const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';

    // Physical register cash
    const startingCashBaseline = DEMO_STARTING_CASH;
    const cashInRegister = startingCashBaseline + totalCash;

    return {
      grossRevenue,
      totalExpense,
      netProfit,
      profitMargin,
      cashInRegister,
      channels: {
        cash: {
          total: totalCash,
          share: grossRevenue > 0 ? ((totalCash / grossRevenue) * 100).toFixed(1) : '0',
          count: DEMO_CHANNEL_COUNTS.cash + salesHistory.filter((s) => s.method === 'cash').length,
        },
        shopier: {
          total: totalShopier,
          share: grossRevenue > 0 ? ((totalShopier / grossRevenue) * 100).toFixed(1) : '0',
          count: DEMO_CHANNEL_COUNTS.shopier + salesHistory.filter((s) => s.method === 'shopier').length,
        },
        iban: {
          total: totalIban,
          share: grossRevenue > 0 ? ((totalIban / grossRevenue) * 100).toFixed(1) : '0',
          count: DEMO_CHANNEL_COUNTS.iban + salesHistory.filter((s) => s.method === 'iban').length,
        },
      },
    };
  }, [liveChannelRevenue, expenses, salesHistory]);

  // 6-Month Income vs Expense Trend
  const monthlyFlow = useMemo(() => {
    const data = [...DEMO_MONTHLY_FLOW, { month: 'Haziran', income: financialSummary.grossRevenue, expense: financialSummary.totalExpense }];

    const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 160000);
    return { data, maxVal };
  }, [financialSummary]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseExpenseAmount(newAmount);
    if (!newTitle.trim() || parsedAmount === null) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      amount: parsedAmount,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      channel: newChannel,
    };

    onAddExpense(newItem);
    setNewTitle('');
    setNewAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Sub Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Finans
            </p>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
            Finans ve Analiz
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-600 dark:text-zinc-300 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>Dönem · Haziran 2026</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Toplam Ciro */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <DollarSign className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Toplam Ciro
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Saha + Online
                </p>
              </div>
            </div>
            <span className="flex flex-row items-center gap-1 whitespace-nowrap shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              <ArrowUpRight className="h-3 w-3 shrink-0" />
              <span>+%18.4</span>
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {formatTry(financialSummary.grossRevenue)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              Brüt satış gelirleri
            </p>
          </div>
        </div>

        {/* Card 2: Toplam Gider */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <TrendingDown className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Toplam Gider
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Maliyet Kalemleri
                </p>
              </div>
            </div>
            <span className="flex flex-row items-center gap-1 whitespace-nowrap shrink-0 rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20">
              <ArrowDownRight className="h-3 w-3 shrink-0" />
              <span>-%4.2</span>
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {formatTry(financialSummary.totalExpense)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              {expenses.length} aktif gider kaydı
            </p>
          </div>
        </div>

        {/* Card 3: Net Kâr ve Marj */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Net Kâr
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Brüt kârlılık
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              %{financialSummary.profitMargin} Marj
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatTry(financialSummary.netProfit)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              Giderler düşüldükten sonra
            </p>
          </div>
        </div>

        {/* Card 4: Kasa Nakit Durumu */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Wallet className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-400 uppercase">
                  Kasa Nakit
                </p>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Fiziksel Kasa
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
              Canlı Akış
            </span>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {formatTry(financialSummary.cashInRegister)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
              Eldeki hazır saha nakdi
            </p>
          </div>
        </div>
      </div>

      {/* Satış Kanalları Analizi */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Kanal Dağılımı
            </p>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
              Hangi Kanaldan Ne Kadar Kazanıyoruz?
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-500" />
              <span className="text-gray-600 dark:text-zinc-300">Saha (Nakit)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-amber-500" />
              <span className="text-gray-600 dark:text-zinc-300">Online (Shopier)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-sky-500" />
              <span className="text-gray-600 dark:text-zinc-300">Havale (IBAN)</span>
            </div>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="mt-6">
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100 p-0.5 flex gap-1 dark:bg-zinc-800">
            <div
              style={{ width: `${financialSummary.channels.cash.share}%` }}
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              title={`Saha (Nakit): %${financialSummary.channels.cash.share}`}
            />
            <div
              style={{ width: `${financialSummary.channels.shopier.share}%` }}
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              title={`Online (Shopier): %${financialSummary.channels.shopier.share}`}
            />
            <div
              style={{ width: `${financialSummary.channels.iban.share}%` }}
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              title={`Havale (IBAN): %${financialSummary.channels.iban.share}`}
            />
          </div>
        </div>

        {/* 3 Channel Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cash */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Banknote className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-gray-900 dark:text-white">
                    Saha (Nakit)
                  </p>
                  <p className="truncate text-[10px] text-gray-400 dark:text-zinc-500">
                    Fiziksel Satış
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                %{financialSummary.channels.cash.share}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="truncate text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                {formatTry(financialSummary.channels.cash.total)}
              </p>
              <p className="shrink-0 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {financialSummary.channels.cash.count} işlem
              </p>
            </div>
          </div>

          {/* Shopier */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <Globe className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-gray-900 dark:text-white">
                    Online (Shopier)
                  </p>
                  <p className="truncate text-[10px] text-gray-400 dark:text-zinc-500">
                    Web & Sosyal Medya
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                %{financialSummary.channels.shopier.share}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="truncate text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                {formatTry(financialSummary.channels.shopier.total)}
              </p>
              <p className="shrink-0 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {financialSummary.channels.shopier.count} işlem
              </p>
            </div>
          </div>

          {/* IBAN */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                  <Building2 className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-gray-900 dark:text-white">
                    Havale (IBAN)
                  </p>
                  <p className="truncate text-[10px] text-gray-400 dark:text-zinc-500">
                    Banka Transferi
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-sky-100 px-2 py-0.5 text-xs font-black text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                %{financialSummary.channels.iban.share}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="truncate text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                {formatTry(financialSummary.channels.iban.total)}
              </p>
              <p className="shrink-0 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {financialSummary.channels.iban.count} işlem
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Gelir-Gider Akışı Trendi & Gider Kalemleri Tablosu */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Gelir-Gider Akışı Grafiği (3 cols on lg) */}
        <div className="lg:col-span-3 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800 shrink-0">
            <div>
              <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                Trend Karşılaştırması
              </p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                Gelir - Gider Akışı
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-emerald-500" />
                <span className="text-gray-600 dark:text-zinc-300">Gelir</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-rose-500" />
                <span className="text-gray-600 dark:text-zinc-300">Gider</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="mt-6 flex flex-col justify-between">
            <div className="flex h-56 sm:h-60 items-end justify-between gap-2 sm:gap-4 pt-6 px-1">
              {monthlyFlow.data.map((item, idx) => {
                const incomeHeight = Math.max(16, Math.round((item.income / monthlyFlow.maxVal) * 100));
                const expenseHeight = Math.max(12, Math.round((item.expense / monthlyFlow.maxVal) * 100));
                const isHovered = hoveredMonthIdx === idx;
                const netMonthly = item.income - item.expense;

                return (
                  <div
                    key={item.month}
                    className="relative flex flex-1 flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 whitespace-nowrap rounded-2xl bg-gray-900 px-3.5 py-2 text-[11px] font-bold text-white shadow-2xl dark:bg-white dark:text-zinc-900 animate-toast-in">
                        <p className="font-black text-xs">{item.month}</p>
                        <p className="text-emerald-400 dark:text-emerald-600">Gelir: {formatTry(item.income)}</p>
                        <p className="text-rose-400 dark:text-rose-600">Gider: {formatTry(item.expense)}</p>
                        <p className="text-gray-300 dark:text-zinc-500 text-[10px] mt-0.5 border-t border-white/20 dark:border-black/20 pt-0.5">
                          Net Kâr: {formatTry(netMonthly)}
                        </p>
                      </div>
                    )}

                    {/* Bars pair */}
                    <div className="w-full max-w-[54px] flex items-end justify-center gap-1.5 h-full">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incomeHeight}%` }}
                        className="w-1/2 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm transition-all duration-300 group-hover:brightness-110"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expenseHeight}%` }}
                        className="w-1/2 rounded-t-lg bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>

                    {/* Month Label */}
                    <div className="mt-3 text-center">
                      <p className="text-xs font-bold text-gray-700 dark:text-zinc-300 truncate max-w-[64px]">
                        {item.month.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Insight */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs font-medium text-gray-500 dark:border-zinc-800 dark:text-zinc-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-white">Dönem Net Kârı:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatTry(financialSummary.netProfit)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-white">Aylık Ort. Kâr:</span>
                <span>{formatTry(Math.round(financialSummary.netProfit / 6))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gider Kalemleri Tablosu (2 cols on lg) - Natural Flow & Max 5 items */}
        <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col">
          {/* Clickable Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800 shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setIsAllExpensesModalOpen(true)}
              className="group flex flex-col text-left cursor-pointer transition p-1.5 -m-1.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/60 active:scale-[0.98]"
              title="Tüm gider geçmişini görüntüle"
            >
              <p className="text-xs font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
                <span>Maliyet Kayıtları</span>
                <Maximize2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Gider Kalemleri
                </h3>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25 border border-rose-200/60 dark:border-rose-500/20"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Gider Ekle</span>
            </button>
          </div>

          {/* Scrollable list of expenses - Exactly 5 items limit */}
          <div className="mt-3 overflow-y-auto max-h-[350px] pr-2 divide-y divide-gray-100 dark:divide-zinc-800/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
            {expenses.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setSelectedExpense(exp)}
                className="group flex w-full items-center justify-between py-3 px-2 -mx-2 rounded-2xl text-left transition hover:bg-gray-50 dark:hover:bg-zinc-800/60 active:scale-[0.99] cursor-pointer"
                title="Gider detayını görüntüle"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-xs font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {exp.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(exp.category)}`}>
                      {exp.category}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {exp.date} · {exp.channel}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                    -{formatTry(exp.amount)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Yeni Gider Ekle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="animate-modal-in relative flex w-full max-w-md flex-col overflow-visible rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <Plus className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-rose-600 dark:text-rose-400 uppercase">
                    Gider Modülü
                  </p>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">
                    Yeni Gider Ekle
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Gider Başlığı / Açıklama
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Fermuar & Baskı Malzemeleri"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Custom Kategori Dropdown */}
                <div className="relative" ref={categoryRef}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Kategori
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryOpen(!categoryOpen);
                      setChannelOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:hover:bg-zinc-800"
                    aria-expanded={categoryOpen}
                  >
                    <span>{newCategory}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-zinc-400 ${
                        categoryOpen ? 'rotate-180 text-rose-500' : ''
                      }`}
                    />
                  </button>

                  {categoryOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-modal-in">
                      {CATEGORIES.map((cat) => {
                        const isSelected = newCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setNewCategory(cat);
                              setCategoryOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                              isSelected
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                                : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
                            }`}
                          >
                            <span>{cat}</span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Tutar (₺)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Örn: 5000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white"
                  />
                </div>
              </div>

              {/* Custom Ödeme Kanalı Dropdown */}
              <div className="relative" ref={channelRef}>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Ödeme Kanalı
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setChannelOpen(!channelOpen);
                    setCategoryOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:hover:bg-zinc-800"
                  aria-expanded={channelOpen}
                >
                  <span>{newChannel}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-zinc-400 ${
                      channelOpen ? 'rotate-180 text-rose-500' : ''
                    }`}
                  />
                </button>

                {channelOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-modal-in">
                    {CHANNELS.map((ch) => {
                      const isSelected = newChannel === ch;
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => {
                            setNewChannel(ch);
                            setChannelOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
                          }`}
                        >
                          <span>{ch}</span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 active:scale-95"
                >
                  Gideri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tüm Giderler Büyük Modalı */}
      {isAllExpensesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAllExpensesModalOpen(false)}
          />
          <div className="animate-modal-in relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <Receipt className="h-6 w-6" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-rose-600 dark:text-rose-400 uppercase">
                    Maliyet Geçmişi
                  </p>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    Tüm Gider Kalemleri
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAllExpensesModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Yeni Gider</span>
                </button>
                <button
                  onClick={() => setIsAllExpensesModalOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Sub-header summary info */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 dark:bg-zinc-800/40 border-b border-gray-100 dark:border-zinc-800 shrink-0 text-xs">
              <span className="font-semibold text-gray-500 dark:text-zinc-400">
                Kayıt Sayısı: <strong className="text-gray-900 dark:text-white">{expenses.length} adet</strong>
              </span>
              <span className="font-semibold text-gray-500 dark:text-zinc-400">
                Toplam Gider: <strong className="text-rose-600 dark:text-rose-400">{formatTry(financialSummary.totalExpense)}</strong>
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-gray-100 dark:divide-zinc-800/80 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {expenses.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setSelectedExpense(exp)}
                  className="group flex w-full items-center justify-between py-3.5 px-3 rounded-2xl text-left transition hover:bg-gray-50 dark:hover:bg-zinc-800/60 active:scale-[0.99] cursor-pointer"
                  title="Gider detayını görüntüle"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {exp.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(exp.category)}`}>
                        {exp.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        {exp.date} · {exp.channel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-rose-600 dark:text-rose-400">
                      -{formatTry(exp.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 group-hover:text-rose-500 transition-colors flex items-center justify-end gap-1 mt-0.5">
                      <span>Detay</span>
                      <ChevronRight className="h-3 w-3" />
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setIsAllExpensesModalOpen(false)}
                className="w-full rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gider Detayı Modalı */}
      {selectedExpense && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedExpense(null)}
          />
          <div className="animate-modal-in relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <TrendingDown className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-rose-600 dark:text-rose-400 uppercase">
                    Gider Detayı
                  </p>
                  <h2 className="text-base font-black text-gray-900 dark:text-white truncate max-w-[240px]">
                    {selectedExpense.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>İşlem Zamanı</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-gray-800 dark:text-zinc-200">
                    {selectedExpense.date}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    <Tag className="h-3 w-3" />
                    <span>Kategori</span>
                  </div>
                  <div className="mt-1">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(selectedExpense.category)}`}>
                      {selectedExpense.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Description Box */}
              <div className="rounded-2xl bg-gray-50 p-3.5 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">
                  Açıklama / Kalem
                </p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {selectedExpense.title}
                </p>
              </div>

              {/* Payment Channel Box */}
              <div className="rounded-2xl bg-gray-50 p-3.5 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">
                  Ödeme Kanalı:
                </span>
                <span className="text-xs font-black text-gray-900 dark:text-white">
                  {selectedExpense.channel}
                </span>
              </div>

              {/* Total Summary Box (Theme-adjusted: light bg in light mode, dark in dark mode) */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-200/70 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/70">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Toplam Gider Tutarı
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    Maliyet kaydı işlendi
                  </p>
                </div>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                  -{formatTry(selectedExpense.amount)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 dark:border-zinc-800">
              <button
                onClick={() => setSelectedExpense(null)}
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
