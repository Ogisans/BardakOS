import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Moon, Sun, Briefcase, Store } from 'lucide-react';
import { BottomNav, type Tab, type AppMode, type ManagementTab } from '@/components/BottomNav';
import { ConfirmModal, type ConfirmData } from '@/components/ConfirmModal';
import { InventoryTab } from '@/components/InventoryTab';
import { HistoryTab } from '@/components/HistoryTab';
import { SalesTab } from '@/components/SalesTab';
import { WalletTab } from '@/components/WalletTab';
import { PaymentTab } from '@/components/PaymentTab';
import { DashboardTab } from '@/components/management/DashboardTab';
import { FinanceTab } from '@/components/management/FinanceTab';
import { StockAnalyticsTab } from '@/components/management/StockAnalyticsTab';
import { CalendarTab } from '@/components/management/CalendarTab';
import { ToastStack } from '@/components/Toast';
import { useFieldSession } from '@/hooks/useFieldSession';
import { useManagementSession } from '@/hooks/useManagementSession';
import { useCollectionsSession } from '@/hooks/useCollectionsSession';
import { CollectionsTab } from '@/features/collections/CollectionsTab';
import { LoginScreen } from '@/features/session/LoginScreen';
import { ProfileScreen } from '@/features/session/ProfileScreen';
import type { ProfileInput } from '@/types/localSession';
import { initialLocalMode, canUseManagement, canAccessMode, profileInitials } from '@/domain/localSession';
import { authRepository, backendConfig } from '@/repositories/backend';
import type { AuthRepository, Identity } from '@/repositories/auth';
import { useBackendSession } from '@/hooks/useBackendSession';
import { primaryButton, secondaryButton } from '@/features/collections/presentation';
import { demoAccountFillEnabled } from '@/domain/demoAccess';

type Theme = 'light' | 'dark';

function AuthenticatedApp({ identity, repository, theme, onToggleTheme, onSaveProfile, onLogout, busy }: {
  identity: Identity; repository: AuthRepository; theme: Theme; onToggleTheme: () => void; onSaveProfile: (input: ProfileInput) => Promise<void>; onLogout: () => Promise<void>; busy: boolean;
}) {
  const profile = identity.profile;
  const [profileOpen, setProfileOpen] = useState(false);
  const canManage = canUseManagement(profile.role);
  // Match Tailwind's md breakpoint only on first render; resizing keeps the user's choice.
  const [selectedMode, setAppMode] = useState<AppMode>(() => initialLocalMode(profile.role, window.matchMedia('(min-width: 768px)').matches));
  const appMode = canAccessMode(profile.role, selectedMode) ? selectedMode : 'field';
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [managementTab, setManagementTab] = useState<ManagementTab>('dashboard');
  const {
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
  } = useFieldSession();
  const { expenses, addExpense, events, setEvents } = useManagementSession();
  const [collectionsRepository] = useState(() => repository.collections(identity));
  const collectionsSession = useCollectionsSession(collectionsRepository, canManage);
  const mainRef = useRef<HTMLElement | null>(null);
  const profileButton = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<{ mode: AppMode; tab: Tab; managementTab: ManagementTab; scroll: number } | null>(null);
  const restoreScroll = useRef<number | null>(null);
  const openProfile = () => { if (profileOpen) return; returnTo.current = { mode: appMode, tab: activeTab, managementTab, scroll: mainRef.current?.scrollTop ?? 0 }; setProfileOpen(true); };
  const backFromProfile = () => { const previous = returnTo.current; if (previous) { setAppMode(previous.mode); setActiveTab(previous.tab); setManagementTab(previous.managementTab); restoreScroll.current = previous.scroll; } setProfileOpen(false); };

  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = !profileOpen && restoreScroll.current !== null ? restoreScroll.current : 0;
      if (!profileOpen && restoreScroll.current !== null) { restoreScroll.current = null; profileButton.current?.focus({ preventScroll: true }); }
    }
  }, [activeTab, appMode, managementTab, profileOpen, collectionsSession.view.collectionId, collectionsSession.view.tab]);

  const confirmData: ConfirmData | null = pendingSale
    ? { items: pendingSale.items, method: pendingSale.method, total: pendingSale.total }
    : null;
  return (
    <div className="h-[100dvh] w-full overflow-hidden overscroll-none flex flex-col md:flex-row bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-white">
      <ToastStack toasts={toasts} onDismiss={dismissToast} onUndo={handleUndo} />
      <ConfirmModal
        open={modalOpen}
        data={confirmData}
        onConfirm={handleConfirm}
        onCancel={() => setModalOpen(false)}
      />

      <main ref={mainRef} aria-labelledby="workspace-heading" className="order-first min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-20 pt-5 no-scrollbar md:order-none md:pb-6">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col md:max-w-5xl">
          <header aria-label="Çalışma alanı başlığı" className="mb-6 flex items-center gap-3">
            <img
              src="/bardak_logo.png"
              alt="Bardak Stüdyo Logo"
              className="h-9 w-9 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-gray-400 dark:text-zinc-500">
                {appMode === 'management' ? 'BARDAK STÜDYO · YÖNETİM' : 'BARDAK STÜDYO · SAHA'}
              </p>
              <h1 id="workspace-heading" className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {profileOpen ? 'Profilim' : appMode === 'management'
                  ? (managementTab === 'dashboard'
                      ? 'Dashboard'
                      : managementTab === 'collections'
                        ? (collectionsSession.collections.find(item => item.id === collectionsSession.view.collectionId)?.name ?? 'Koleksiyonlar')
                      : managementTab === 'finance'
                        ? 'Finans ve Analiz'
                        : managementTab === 'inventory'
                          ? 'Stok ve Analiz'
                          : 'Takvim')
                  : activeTab === 'sales'
                    ? 'Tezgahtar'
                    : activeTab === 'inventory'
                      ? 'Stok'
                      : activeTab === 'history'
                        ? 'Geçmiş'
                        : activeTab === 'wallet'
                          ? 'Cüzdan'
                          : 'Ödeme'}
              </h1>
            </div>

            {/* Mode Switch Button (Mobile only) */}
            {canManage && <button
              onClick={() => setAppMode((m) => (m === 'field' ? 'management' : 'field'))}
              className={`flex md:hidden h-11 items-center gap-2 rounded-xl border px-3 transition active:scale-95 shadow-sm ${
                appMode === 'field'
                  ? 'border-purple-200 bg-purple-50/80 text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/70'
                  : 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70'
              }`}
              aria-label={appMode === 'field' ? 'Yönetim Moduna Geç' : 'Saha Moduna Dön'}
              title={appMode === 'field' ? 'Yönetim Moduna Geç' : 'Saha Moduna Dön'}
            >
              {appMode === 'field' ? (
                <>
                  <Briefcase className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                  <span className="text-xs font-bold hidden sm:inline">Yönetim Modu</span>
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                  <span className="text-xs font-bold hidden sm:inline">Saha Modu</span>
                </>
              )}
            </button>}

            <button ref={profileButton} type="button" aria-label="Profilim" aria-pressed={profileOpen} title={profile.name + ' · Profilim'} onClick={openProfile} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">{profileInitials(profile.name)}</button>

            {/* Theme Toggle Button (Mobile only) */}
            <button
              onClick={onToggleTheme}
              className="flex md:hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Tema değiştir"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" strokeWidth={2.5} /> : <Sun className="h-5 w-5" strokeWidth={2.5} />}
            </button>
          </header>
          {profileOpen && <ProfileScreen profile={profile} onBack={backFromProfile} onSave={onSaveProfile} onLogout={onLogout} busy={busy} persistent={backendConfig.mode === 'supabase'} />}
          <div hidden={profileOpen}>
          {appMode === 'management' ? (
            managementTab === 'dashboard' ? (
              <DashboardTab
                stock={stock}
                salesHistory={salesHistory}
                transferHistory={transferHistory}
              />
            ) : managementTab === 'collections' ? (
              <CollectionsTab session={collectionsSession} />
            ) : managementTab === 'finance' ? (
              <FinanceTab
                salesHistory={salesHistory}
                expenses={expenses}
                onAddExpense={addExpense}
              />
            ) : managementTab === 'inventory' ? (
              <StockAnalyticsTab
                stock={stock}
                salesHistory={salesHistory}
              />
            ) : (
              <CalendarTab events={events} onEventsChange={setEvents} />
            )
          ) : activeTab === 'sales' ? (
            <SalesTab
              stock={stock}
              color={color}
              size={size}
              qty={qty}
              method={method}
              cart={cart}
              onColorChange={setColor}
              onSizeChange={setSize}
              onQtyChange={setQty}
              onMethodChange={setMethod}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
            />
          ) : activeTab === 'inventory' ? (
            <InventoryTab
              stock={stock}
              transfers={transfers}
              onCompleteBatch={handleCompleteBatch}
              onCancelBatch={handleCancelBatch}
              onCreateTransfers={handleCreateTransfers}
            />
          ) : activeTab === 'history' ? (
            <HistoryTab sales={salesHistory} transfers={transferHistory} />
          ) : activeTab === 'wallet' ? (
            <WalletTab
              sales={salesHistory}
              startingCash={startingCash}
              onSetStartingCash={setStartingCash}
            />
          ) : (
            <PaymentTab />
          )}
          </div>
        </div>
      </main>

      <div className="shrink-0 order-last md:order-first">
        <BottomNav
          mode={appMode}
          active={activeTab}
          activeManagementTab={managementTab}
          onChange={tab => { setProfileOpen(false); setActiveTab(tab); }}
          onManagementChange={tab => { if (canManage) { setProfileOpen(false); setManagementTab(tab); } }}
          onToggleMode={canManage ? () => setAppMode(m => m === 'field' ? 'management' : 'field') : undefined}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    </div>
  );
}

function SessionApp({ repository, theme, toggleTheme }: { repository: AuthRepository; theme: Theme; toggleTheme: () => void }) {
  const session = useBackendSession(repository);
  return <>
    {session.identity && <div hidden={session.status !== 'ready'}><AuthenticatedApp key={session.key} identity={session.identity} repository={repository} theme={theme} onToggleTheme={toggleTheme} onSaveProfile={session.saveProfile} onLogout={session.signOut} busy={session.busy} /></div>}
    {session.status === 'signed_out' && <LoginScreen onLogin={session.signIn} theme={theme} onToggleTheme={toggleTheme} busy={session.busy} preview={backendConfig.mode === 'preview'} showTestAccounts={demoAccountFillEnabled(backendConfig, import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS)} />}
    {(session.status === 'loading' || session.status === 'error') && <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 p-5 dark:bg-zinc-950"><section className="w-full max-w-md space-y-5 rounded-3xl border border-gray-200 bg-white p-7 dark:border-zinc-800 dark:bg-zinc-900"><h1 className="text-xl font-black">{session.status === 'loading' ? 'Oturum doğrulanıyor…' : 'Çalışma alanı açılamadı'}</h1>{session.error && <p role="alert" className="text-sm text-rose-600">{session.error}</p>}{session.status === 'error' && <div className="flex flex-wrap gap-3"><button disabled={session.busy} onClick={() => void session.retry()} className={primaryButton}>Yeniden dene</button><button disabled={session.busy} onClick={() => { void session.signOut().catch(() => {}); }} className={secondaryButton}>Çıkış yap</button></div>}</section></div>}
  </>;
}

function App() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light');
  return authRepository ? <SessionApp repository={authRepository} theme={theme} toggleTheme={toggleTheme} /> : <div className="min-h-[100dvh] bg-gray-50 p-8 dark:bg-zinc-950"><section className="mx-auto max-w-lg space-y-4 rounded-3xl border border-gray-200 bg-white p-7 dark:border-zinc-800 dark:bg-zinc-900"><h1 className="text-xl font-black">Supabase kurulumu gerekli</h1><p role="alert" className="text-sm text-gray-600 dark:text-zinc-300">{backendConfig.mode === 'invalid' ? backendConfig.message : ''}</p></section></div>;
}

export default App;
