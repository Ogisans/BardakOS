import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export function CollectionDialog({ title, children, onClose, busy = false }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const latest = useRef({ onClose, busy });
  useBodyScrollLock(true);
  useEffect(() => { latest.current = { onClose, busy }; }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = panel.current;
    const first = dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? dialog?.querySelector<HTMLElement>('button');
    first?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !latest.current.busy) { event.preventDefault(); latest.current.onClose(); }
      if (event.key !== 'Tab' || !dialog) return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter(node => node.tabIndex >= 0 && node.getClientRects().length);
      const firstNode = nodes[0], lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === firstNode) { event.preventDefault(); lastNode?.focus(); }
      else if (!event.shiftKey && document.activeElement === lastNode) { event.preventDefault(); firstNode?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6" onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0"><p className="text-[10px] font-black tracking-[0.18em] text-emerald-600 dark:text-emerald-400">BARDAK STÜDYO · KOLEKSİYON</p><h2 id={titleId} className="break-words text-xl font-black text-gray-900 dark:text-white">{title}</h2></div>
          <button type="button" aria-label="Pencereyi kapat" disabled={busy} onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5">{children}</div>
      </div>
    </div>
  );
}
