import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trophy,
  Scissors,
  Users,
  Store,
  Calendar as CalendarIcon,
  Clock,
  X,
  Trash2,
  Check,
  ChevronDown,
  Sparkles,
  Pencil,
  AlertTriangle,
} from 'lucide-react';

import type { CalendarEvent, EventCategory } from '@/types/management';
import { localDateKey, startOfMonth } from '@/domain/dates';

interface CalendarTabProps {
  events: CalendarEvent[];
  onEventsChange: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

const CATEGORY_CONFIG: Record<
  EventCategory,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    borderClass: string;
    icon: typeof Trophy;
  }
> = {
  match: {
    label: 'Maç Günü',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/25',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-500',
    icon: Trophy,
  },
  production: {
    label: 'Üretim',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/25',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
    icon: Scissors,
  },
  sales: {
    label: 'Saha Satış',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-purple-200/80 dark:border-purple-500/25',
    dotClass: 'bg-purple-500',
    borderClass: 'border-l-purple-500',
    icon: Store,
  },
  meeting: {
    label: 'Toplantı',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/25',
    dotClass: 'bg-sky-500',
    borderClass: 'border-l-sky-500',
    icon: Users,
  },
  other: {
    label: 'Genel',
    badgeClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    dotClass: 'bg-zinc-500',
    borderClass: 'border-l-zinc-500',
    icon: CalendarIcon,
  },
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const QUICK_TIMES = ['11:00', '14:00', '19:00', '20:00', '21:30'];

/**
 * Custom Tailwind Time Picker Component
 */
function CustomTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentH, currentM] = (value || '20:00').split(':');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectHour = (h: string) => {
    onChange(`${h}:${currentM || '00'}`);
  };

  const handleSelectMinute = (m: string) => {
    onChange(`${currentH || '20'}:${m}`);
    setIsOpen(false);
  };

  const handleSelectQuickTime = (qt: string) => {
    onChange(qt);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">Saat</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:hover:bg-zinc-800"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-black tracking-wider">{value || '20:00'}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full sm:w-72 z-50 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-toast-in">
          {/* Quick Select Pills */}
          <div className="mb-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Hızlı Saatler
            </p>
            <div className="flex flex-wrap gap-1">
              {QUICK_TIMES.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => handleSelectQuickTime(qt)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                    value === qt
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>

          {/* Hour & Minute Pickers */}
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Hours Column */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1">
                Saat ({currentH})
              </p>
              <div className="h-36 overflow-y-auto pr-1 flex flex-col gap-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={`py-1 rounded-lg text-xs font-bold transition ${
                      currentH === h
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1">
                Dakika ({currentM})
              </p>
              <div className="h-36 overflow-y-auto pr-1 flex flex-col gap-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={`py-1 rounded-lg text-xs font-bold transition ${
                      currentM === m
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarTab({ events, onEventsChange: setEvents }: CalendarTabProps) {
  const todayStr = localDateKey(new Date());
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Edit Event State
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('20:00');
  const [editCategory, setEditCategory] = useState<EventCategory>('match');
  const [editCategoryDropdownOpen, setEditCategoryDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  // New Event Form in Modal
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('20:00');
  const [newCategory, setNewCategory] = useState<EventCategory>('match');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close new event dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setEditCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedDateStr) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedDateStr]);

  // Calendar month computations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    // First day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based: 0..6
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;
      const dayOfWeek = (prevDate.getDay() + 6) % 7;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isWeekend: dayOfWeek >= 5,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const m = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${m}-${dayStr}`;
      const dayOfWeek = (new Date(year, month, d).getDay() + 6) % 7;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isWeekend: dayOfWeek >= 5,
        isToday: dateStr === todayStr,
      });
    }

    // Next month days to fill 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;
      const dayOfWeek = (nextDate.getDay() + 6) % 7;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isWeekend: dayOfWeek >= 5,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month, todayStr]);

  // Events map for fast lookup
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  // Selected date events
  const selectedEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return eventsByDate[selectedDateStr] || [];
  }, [selectedDateStr, eventsByDate]);

  // Format selected date in Turkish
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  }, [selectedDateStr]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(startOfMonth(new Date()));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDateStr) return;

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      date: selectedDateStr,
      title: newTitle.trim(),
      time: newTime || '20:00',
      category: newCategory,
    };

    setEvents((prev) => [...prev, newEv]);
    setNewTitle('');
    setNewTime('20:00');
    setIsAddingEvent(false);
  };

  const handleStartEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditTime(ev.time);
    setEditCategory(ev.category);
    setIsAddingEvent(false);
    setDeletingEventId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editTitle.trim()) return;

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === editingEvent.id
          ? {
              ...ev,
              title: editTitle.trim(),
              time: editTime || '20:00',
              category: editCategory,
            }
          : ev
      )
    );
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setDeletingEventId(null);
  };

  // Next upcoming match calculation for top banner
  const nextMatch = useMemo(() => {
    const upcoming = events
      .filter((ev) => ev.category === 'match' && ev.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  }, [events, todayStr]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Sub Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Takvim
            </p>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
            Etkinlik Takvimi
          </h2>
        </div>

        {/* Next Match Highlight Banner */}
        {nextMatch && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10 shadow-sm self-start sm:self-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span>{nextMatch.date === todayStr ? 'Bugün Maç Var!' : 'Sıradaki Maç'}</span>
                {nextMatch.date === todayStr && <Sparkles className="h-3 w-3 animate-bounce" />}
              </p>
              <p className="text-xs font-black text-gray-900 dark:text-white">
                {nextMatch.title} · <span className="text-emerald-600 dark:text-emerald-400">{nextMatch.time}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Calendar Card */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Month Navigation & Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition active:scale-95 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 cursor-pointer"
            >
              Bugün
            </button>
          </div>

          {/* Month Change Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 shadow-sm cursor-pointer"
              aria-label="Önceki Ay"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 shadow-sm cursor-pointer"
              aria-label="Sonraki Ay"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60 text-center text-xs font-black uppercase tracking-wider text-gray-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={`py-3 ${idx >= 5 ? 'text-rose-500/80 dark:text-rose-400/80' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid (Days) */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-zinc-800/80 border-b border-gray-100 dark:border-zinc-800">
          {calendarGrid.map((cell) => {
            const dayEvents = eventsByDate[cell.dateStr] || [];
            const isSelected = selectedDateStr === cell.dateStr;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDateStr(cell.dateStr);
                  setIsAddingEvent(false);
                  setEditingEvent(null);
                  setDeletingEventId(null);
                }}
                className={`group relative flex flex-col min-h-[90px] sm:min-h-[110px] md:min-h-[125px] p-2 sm:p-2.5 text-left transition-all duration-200 focus:outline-none cursor-pointer ${
                  !cell.isCurrentMonth
                    ? 'bg-gray-50/40 opacity-40 dark:bg-zinc-950/40'
                    : cell.isWeekend
                      ? 'bg-gray-50/20 dark:bg-zinc-900/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5'
                      : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5'
                } ${
                  cell.isToday
                    ? 'bg-emerald-50/40 dark:bg-emerald-500/10 ring-2 ring-inset ring-emerald-500/60'
                    : ''
                } ${
                  isSelected ? 'ring-2 ring-inset ring-emerald-600' : ''
                }`}
              >
                {/* Day Number & Today Pill */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black transition ${
                      cell.isToday
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : cell.isCurrentMonth
                          ? cell.isWeekend
                            ? 'text-rose-600 dark:text-rose-400 group-hover:text-emerald-600'
                            : 'text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                          : 'text-gray-400 dark:text-zinc-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {cell.isToday && (
                    <span className="hidden sm:inline-block rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300">
                      Bugün
                    </span>
                  )}
                </div>

                {/* Events list in day cell */}
                <div className="mt-1.5 flex flex-col gap-1 w-full flex-1">
                  {/* Desktop: Event Pills */}
                  <div className="hidden sm:flex flex-col gap-1 w-full">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const cfg = CATEGORY_CONFIG[ev.category];
                      return (
                        <div
                          key={ev.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border truncate transition ${cfg.badgeClass}`}
                          title={`${ev.time} - ${ev.title}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
                          <span className="shrink-0 text-[10px] opacity-80">{ev.time}</span>
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 pl-1">
                        +{dayEvents.length - 2} etkinlik
                      </span>
                    )}
                  </div>

                  {/* Mobile: Colored Dot Indicators */}
                  <div className="flex sm:hidden items-center gap-1 mt-auto pt-1 flex-wrap">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const cfg = CATEGORY_CONFIG[ev.category];
                      return (
                        <span
                          key={ev.id}
                          className={`h-2 w-2 rounded-full ${cfg.dotClass}`}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] font-bold text-gray-400">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 bg-gray-50/50 dark:bg-zinc-900/60 text-xs font-semibold">
          <span className="text-gray-500 dark:text-zinc-400">Etkinlik Türleri:</span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {Object.entries(CATEGORY_CONFIG).map(([catKey, cfg]) => (
              <div key={catKey} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
                <span className="text-gray-700 dark:text-zinc-300 text-xs">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setSelectedDateStr(null);
              setIsAddingEvent(false);
              setEditingEvent(null);
              setDeletingEventId(null);
            }}
          />

          {/* Dialog Body */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 dark:border-zinc-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Günlük Program
                  </p>
                </div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mt-0.5">
                  {formattedSelectedDate}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDateStr(null);
                  setIsAddingEvent(false);
                  setEditingEvent(null);
                  setDeletingEventId(null);
                }}
                className="rounded-2xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-zinc-800/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {/* Existing Events List */}
              <div className="flex flex-col gap-2.5 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Planlanan Etkinlikler ({selectedEvents.length})
                  </p>
                  {!isAddingEvent && !editingEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingEvent(true);
                        setEditingEvent(null);
                        setDeletingEventId(null);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Yeni Ekle</span>
                    </button>
                  )}
                </div>

                {selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-400 mb-2">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                      Bu gün için kayıtlı etkinlik yok
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Yukarıdaki butona tıklayarak yeni bir etkinlik ekleyebilirsiniz.
                    </p>
                  </div>
                ) : (
                  selectedEvents.map((ev) => {
                    const cfg = CATEGORY_CONFIG[ev.category];
                    const IconComponent = cfg.icon;
                    const isDeleting = deletingEventId === ev.id;
                    const isBeingEdited = editingEvent?.id === ev.id;

                    // If user is confirming delete for this specific event
                    if (isDeleting) {
                      return (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-toast-in"
                        >
                          <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-300">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span className="text-xs font-bold">
                              "{ev.title}" silinsin mi?
                            </span>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setDeletingEventId(null)}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition cursor-pointer"
                            >
                              Vazgeç
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 active:scale-95 transition shadow-sm cursor-pointer"
                            >
                              Evet, Sil
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={ev.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border bg-gray-50/70 dark:bg-zinc-800/40 border-gray-200/80 dark:border-zinc-800/80 border-l-4 ${
                          cfg.borderClass
                        } group hover:shadow-sm transition ${
                          isBeingEdited ? 'ring-2 ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10' : ''
                        }`}
                      >
                        {/* Event Content - Clickable for Edit */}
                        <div
                          onClick={() => handleStartEdit(ev)}
                          className="flex items-center gap-3 min-w-0 pr-3 flex-1 cursor-pointer"
                          title="Düzenlemek için tıkla"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-gray-700 dark:text-zinc-200 group-hover:scale-105 transition-transform">
                            <IconComponent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${cfg.badgeClass}`}>
                                {cfg.label}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400">
                                <Clock className="h-3 w-3" />
                                {ev.time}
                              </span>
                            </div>
                            <p className="text-sm font-black text-gray-900 dark:text-white mt-1 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {ev.title}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(ev)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 rounded-xl transition cursor-pointer"
                            title="Etkinliği Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingEventId(ev.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl transition cursor-pointer"
                            title="Etkinliği Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Edit Event Form */}
              {editingEvent && (
                <form onSubmit={handleSaveEdit} className="pt-4 flex flex-col gap-3 animate-toast-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Etkinliği Düzenle
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                      Etkinlik / Rakip Adı
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Fenerbahçe SK veya Stok Sayımı"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:focus:bg-zinc-900"
                    />
                  </div>

                  {/* Time & Category Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Custom Time Picker */}
                    <CustomTimePicker value={editTime} onChange={setEditTime} />

                    {/* Custom Category Dropdown */}
                    <div className="relative" ref={editDropdownRef}>
                      <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                        Kategori
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditCategoryDropdownOpen(!editCategoryDropdownOpen)}
                        className="mt-1 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${CATEGORY_CONFIG[editCategory].dotClass}`} />
                          <span>{CATEGORY_CONFIG[editCategory].label}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </button>

                      {editCategoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-full z-50 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-toast-in">
                          {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setEditCategory(cat);
                                setEditCategoryDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                                editCategory === cat
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                  : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${CATEGORY_CONFIG[cat].dotClass}`} />
                                <span>{CATEGORY_CONFIG[cat].label}</span>
                              </div>
                              {editCategory === cat && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="flex-1 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white transition hover:bg-emerald-500 active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Güncelle</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Add Event Form */}
              {isAddingEvent && !editingEvent && (
                <form onSubmit={handleAddEvent} className="pt-4 flex flex-col gap-3 animate-toast-in">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Yeni Etkinlik Formu
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                      Etkinlik / Rakip Adı
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Fenerbahçe SK veya Stok Sayımı"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:focus:bg-zinc-900"
                    />
                  </div>

                  {/* Time & Category Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Custom Time Picker */}
                    <CustomTimePicker value={newTime} onChange={setNewTime} />

                    {/* Custom Category Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                        Kategori
                      </label>
                      <button
                        type="button"
                        onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                        className="mt-1 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-white dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${CATEGORY_CONFIG[newCategory].dotClass}`} />
                          <span>{CATEGORY_CONFIG[newCategory].label}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </button>

                      {categoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-full z-50 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-toast-in">
                          {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setNewCategory(cat);
                                setCategoryDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                                newCategory === cat
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                  : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${CATEGORY_CONFIG[cat].dotClass}`} />
                                <span>{CATEGORY_CONFIG[cat].label}</span>
                              </div>
                              {newCategory === cat && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white transition hover:bg-emerald-500 active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Etkinliği Kaydet</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
