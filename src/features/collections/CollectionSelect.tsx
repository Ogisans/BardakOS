import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { inputClass } from './presentation';

interface SelectOption { value: string; label: string }
interface CollectionSelectProps {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  label: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}

/** Select-only combobox: focus stays on the trigger, including inside a modal. */
export function CollectionSelect({ value, options, onChange, label, id, name, disabled = false, invalid, describedBy, className = '' }: CollectionSelectProps) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number; side: string } | null>(null);
  const selected = Math.max(0, options.findIndex(option => option.value === value));

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const edgeTop = (viewport?.offsetTop ?? 0) + 8;
      const edgeBottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 8;
      if (rect.bottom < edgeTop || rect.top > edgeBottom) { setOpen(false); return; }
      const width = Math.min(rect.width, document.documentElement.clientWidth - 16);
      const below = Math.max(0, edgeBottom - rect.bottom - 6);
      const above = Math.max(0, rect.top - edgeTop - 6);
      const desired = Math.min(264, options.length * 44 + 8);
      const up = below < desired && above > below;
      const height = Math.min(desired, up ? above : below);
      setPosition({ top: up ? rect.top - height - 6 : rect.bottom + 6, left: Math.max(8, Math.min(rect.left, document.documentElement.clientWidth - width - 8)), width, maxHeight: height, side: up ? 'up' : 'down' });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);
  const placement = position?.side;
  useLayoutEffect(() => {
    if (open && placement) list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, placement]);

  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const keydown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : !open ? selected : (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      setOpen(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active); else { setActive(selected); setOpen(true); }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const now = Date.now();
      search.current = { text: (now - search.current.at < 700 ? search.current.text : '') + event.key.toLocaleLowerCase('tr-TR'), at: now };
      const index = options.findIndex(option => option.label.toLocaleLowerCase('tr-TR').startsWith(search.current.text));
      if (index >= 0) { event.preventDefault(); setActive(index); setOpen(true); }
    }
  };

  return <div ref={root} className={`min-w-0 ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button ref={trigger} id={id} name={name} type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={open ? listId : undefined} aria-activedescendant={open ? `${listId}-${active}` : undefined} aria-invalid={invalid} aria-describedby={describedBy} disabled={disabled} className={`${inputClass} flex min-h-11 items-center justify-between gap-3 text-left disabled:cursor-wait disabled:opacity-50`} onKeyDown={keydown} onClick={() => { setActive(selected); setOpen(current => !current); }}>
      <span className="min-w-0 truncate">{options[selected]?.label}</span><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-gray-500 transition-transform dark:text-zinc-400 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && !disabled && position && <div ref={list} id={listId} role="listbox" aria-label={label} data-placement={position.side} className="fixed z-[80] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900" style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}>
      {options.map((option, index) => <div key={option.value} id={`${listId}-${index}`} role="option" aria-selected={option.value === value} data-index={index} className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${index === active ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/30' : 'text-gray-700 dark:text-zinc-200'} ${option.value === value ? 'font-bold' : ''}`} onPointerDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
        <span className="min-w-0 break-words">{option.label}</span><Check aria-hidden="true" className={`h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 ${option.value === value ? '' : 'invisible'}`} />
      </div>)}
    </div>}
  </div>;
}
