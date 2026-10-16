import { useEffect, useState } from 'react';
import { CheckCircle2, Undo2, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  sub?: string;
  undoId?: number;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
  onUndo: (undoId: number) => void;
}

export function ToastStack({ toasts, onDismiss, onUndo }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} onUndo={onUndo} />
      ))}
    </div>
  );
}

function Toast({
  toast,
  onDismiss,
  onUndo,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
  onUndo: (undoId: number) => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const hasUndo = toast.undoId !== undefined;

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), hasUndo ? 5000 : 2600);
    return () => clearTimeout(t);
  }, [hasUndo]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => onDismiss(toast.id), 240);
    return () => clearTimeout(t);
  }, [leaving, toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/30 bg-white shadow-2xl ring-1 ring-black/5 dark:border-emerald-500/30 dark:bg-zinc-900 dark:ring-white/10 ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-gray-900 dark:text-emerald-100">
            {toast.message}
          </p>
          {toast.sub && (
            <p className="truncate text-sm font-medium text-gray-500 dark:text-emerald-300/70">
              {toast.sub}
            </p>
          )}
        </div>
        {hasUndo && (
          <button
            onClick={() => {
              onUndo(toast.undoId!);
              setLeaving(true);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-sm font-black text-white shadow-md transition active:scale-95 hover:bg-emerald-600"
          >
            <Undo2 className="h-4 w-4" strokeWidth={2.8} />
            GERİ AL
          </button>
        )}
        <button
          onClick={() => setLeaving(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {hasUndo && (
        <div className="h-1 w-full bg-emerald-100 dark:bg-zinc-800">
          <div
            className="h-full origin-left bg-emerald-500"
            style={{ animation: 'shrink-bar 5s linear forwards' }}
          />
        </div>
      )}
    </div>
  );
}
