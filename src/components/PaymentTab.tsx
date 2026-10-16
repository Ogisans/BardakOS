import { Building2, QrCode } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type PaymentView = 'iban' | 'qr';

export function PaymentTab() {
  const [view, setView] = useState<PaymentView>('iban');

  return (
    <div className="flex h-full flex-col gap-3 md:grid md:grid-cols-2 md:gap-6 md:items-start">
      {/* IBAN Bölümü */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:col-span-1">
        <div className="border-b border-gray-100 px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            ÖDEME BİLGİLERİ
          </p>
          <h2 className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">
            Havale / EFT
          </h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Mobilde toggle butonları */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <PaymentButton
              active={view === 'iban'}
              icon={<Building2 className="h-5 w-5" strokeWidth={2.5} />}
              onClick={() => setView('iban')}
            >
              IBAN
            </PaymentButton>
            <PaymentButton
              active={view === 'qr'}
              icon={<QrCode className="h-5 w-5" strokeWidth={2.5} />}
              onClick={() => setView('qr')}
            >
              QR
            </PaymentButton>
          </div>

          <div className={`space-y-3 rounded-2xl bg-gray-50 p-4 dark:bg-zinc-800/60 ${view === 'iban' ? 'block' : 'hidden md:block'}`}>
            <InfoRow label="IBAN" value="Hesap tanımlanmamış" />
            <div className="h-px bg-gray-200 dark:bg-zinc-700" />
            <InfoRow label="ALICI" value="—" />
          </div>
        </div>
      </section>

      {/* QR Bölümü */}
      <section className={`overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:col-span-1 ${view === 'qr' ? 'block' : 'hidden md:block'}`}>
        <div className="border-b border-gray-100 px-5 py-3.5 dark:border-zinc-800">
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            ONLINE ÖDEME
          </p>
          <h2 className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">
            Ödeme QR kodu
          </h2>
        </div>
        <div className="flex justify-center p-5">
          <div className="flex w-full max-w-[15rem] flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950"><QrCode aria-hidden="true" className="h-16 w-16 text-gray-300 dark:text-zinc-600" /><p className="text-sm font-black text-gray-700 dark:text-zinc-200">Ödeme bağlantısı tanımlanmamış</p></div>
        </div>
      </section>
    </div>
  );
}

function PaymentButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-black transition-all active:scale-95 ${
        active
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="break-all text-sm font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
