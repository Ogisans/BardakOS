import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarMonthDays, localDateKey, moveCalendarDay, moveCalendarMonth, parseLocalDate } from '@/domain/dates';
import { inputClass } from './presentation';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
const dayLabel = (value: string) => parseLocalDate(value)!.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

export function DatePicker({ id, name, label, value, onChange, disabled = false, invalid, describedBy }: {
  id: string; name?: string; label: string; value: string; onChange: (value: string) => void;
  disabled?: boolean; invalid?: boolean; describedBy?: string;
}) {
  const popupId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusDay = useRef(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => localDateKey(new Date()));
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const date = parseLocalDate(active)!;
  const month = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const days = calendarMonthDays(active);
  const today = localDateKey(new Date());
  const show = () => { focusDay.current = true; setActive(parseLocalDate(value) ? value : today); setOpen(true); };
  const close = (restore = false) => { setOpen(false); if (restore) trigger.current?.focus({ preventScroll: true }); };
  const choose = (next: string) => { onChange(next); close(true); };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const topEdge = (viewport?.offsetTop ?? 0) + 12;
      const bottomEdge = (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) - 12;
      if (rect.bottom < topEdge || rect.top > bottomEdge) { setOpen(false); return; }
      const width = Math.min(312, document.documentElement.clientWidth - 24);
      const above = Math.max(0, rect.top - topEdge - 6);
      const below = Math.max(0, bottomEdge - rect.bottom - 6);
      const up = below < 382 && above > below;
      const height = Math.min(382, up ? above : below);
      setPosition({ top: up ? rect.top - height - 6 : rect.bottom + 6, left: Math.max(12, Math.min(rect.left, document.documentElement.clientWidth - width - 12)), width, maxHeight: height });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); window.visualViewport?.removeEventListener('resize', place); };
  }, [open]);
  const positioned = position !== null;
  useLayoutEffect(() => {
    if (open && positioned && focusDay.current) {
      panel.current?.querySelector<HTMLElement>(`[data-day="${active}"]`)?.focus({ preventScroll: true });
      panel.current?.querySelector<HTMLElement>(`[data-day="${active}"]`)?.scrollIntoView({ block: 'nearest' });
      focusDay.current = false;
    }
  }, [active, open, positioned]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);

  const move = (next: string) => { focusDay.current = true; setActive(next); };
  const dayKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in delta) { event.preventDefault(); move(moveCalendarDay(active, delta[event.key])); }
    else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); const weekday = (date.getDay() + 6) % 7;
      move(moveCalendarDay(active, event.key === 'Home' ? -weekday : 6 - weekday));
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault(); move(moveCalendarMonth(active, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1)));
    }
  };

  return <div ref={root} className="min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); } }}>
    <button ref={trigger} id={id} name={name} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open && !disabled} aria-controls={open ? popupId : undefined} aria-invalid={invalid} aria-describedby={describedBy} disabled={disabled} className={`${inputClass} flex min-h-11 items-center justify-between gap-3 text-left disabled:opacity-50`} onClick={() => open ? close(true) : show()} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); show(); } }}>
      <span className={`min-w-0 truncate ${value ? '' : 'text-gray-400 dark:text-zinc-500'}`}>{parseLocalDate(value)?.toLocaleDateString('tr-TR') ?? 'Tarih seçin'}</span><CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-500 dark:text-zinc-400" />
    </button>
    {open && !disabled && position && <div ref={panel} id={popupId} role="dialog" aria-label={`${label} seç`} className="fixed z-[90] overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900" style={position}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" aria-label="Önceki ay" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800" onClick={() => move(moveCalendarMonth(active, -1))}><ChevronLeft className="h-4 w-4" /></button>
        <p aria-live="polite" className="text-sm font-black text-gray-900 dark:text-white">{month}</p>
        <button type="button" aria-label="Sonraki ay" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800" onClick={() => move(moveCalendarMonth(active, 1))}><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div role="grid" aria-label={month}>
        <div role="row" className="mb-1 grid grid-cols-7">{WEEKDAYS.map(day => <span key={day} role="columnheader" className="py-1 text-center text-[11px] font-bold text-gray-400 dark:text-zinc-500">{day}</span>)}</div>
        {Array.from({ length: 6 }, (_, week) => <div key={week} role="row" className="grid grid-cols-7 gap-y-1">{days.slice(week * 7, week * 7 + 7).map(day => {
          const current = day.slice(0, 7) === active.slice(0, 7);
          return <div key={day} role="gridcell" aria-selected={day === value} className="flex justify-center"><button type="button" data-day={day} tabIndex={day === active ? 0 : -1} aria-label={dayLabel(day)} aria-current={day === today ? 'date' : undefined} className={`h-9 w-9 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 ${day === value ? 'bg-emerald-600 text-white hover:bg-emerald-700' : current ? 'text-gray-700 hover:bg-emerald-50 dark:text-zinc-200 dark:hover:bg-emerald-500/15' : 'text-gray-300 hover:bg-gray-50 dark:text-zinc-600 dark:hover:bg-zinc-800'}`} onKeyDown={dayKeys} onClick={() => choose(day)}>{Number(day.slice(-2))}</button></div>;
        })}</div>)}
      </div>
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-2 dark:border-zinc-800"><button type="button" onClick={() => choose('')} className="rounded-lg px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800">Temizle</button><button type="button" onClick={() => choose(today)} className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10">Bugün</button></div>
    </div>}
  </div>;
}
