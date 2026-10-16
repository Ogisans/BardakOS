import {
  ShoppingCart,
  Boxes,
  History,
  Wallet,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Briefcase,
  Store,
  Moon,
  Sun,
  PieChart,
  Calendar,
  Layers3,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

export type Tab = 'sales' | 'inventory' | 'history' | 'wallet' | 'payment';
export type ManagementTab = 'dashboard' | 'collections' | 'finance' | 'inventory' | 'calendar';
export type AppMode = 'field' | 'management';

interface BottomNavProps {
  mode?: AppMode;
  active: Tab;
  activeManagementTab?: ManagementTab;
  onChange: (tab: Tab) => void;
  onManagementChange?: (tab: ManagementTab) => void;
  onToggleMode?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function BottomNav({
  mode = 'field',
  active,
  activeManagementTab = 'dashboard',
  onChange,
  onManagementChange,
  onToggleMode,
  theme = 'light',
  onToggleTheme,
}: BottomNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav
      className={`z-40 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 md:h-full md:border-t-0 md:border-r md:flex md:flex-col md:pb-0 md:bg-white dark:md:bg-zinc-950 transition-all duration-300 ${
        isCollapsed ? 'md:w-20' : 'md:w-64'
      }`}
    >
      <div className="mx-auto flex w-full max-w-md md:max-w-none md:flex-col md:gap-1 md:p-4 md:h-full">
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 mb-4 ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
          aria-label={isCollapsed ? 'Genişlet' : 'Daralt'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          )}
        </button>

        {/* Section Header (Desktop only when expanded) */}
        {!isCollapsed && (
          <div className="hidden md:block px-4 pb-2">
            <p className="text-[10px] font-black tracking-wider text-gray-400 dark:text-zinc-500 uppercase">
              {mode === 'management' ? 'Yönetim Menüsü' : 'Saha Menüsü'}
            </p>
          </div>
        )}

        {/* Navigation Items based on mode */}
        {mode === 'management' ? (
          <>
            <NavButton
              label="Dashboard"
              icon={<LayoutDashboard className="h-6 w-6" strokeWidth={2.4} />}
              isActive={activeManagementTab === 'dashboard'}
              onClick={() => onManagementChange?.('dashboard')}
              isCollapsed={isCollapsed}
              mobileCompact
            />
            <NavButton
              label="Koleksiyonlar"
              mobileLabel="Koleksiyon"
              icon={<Layers3 className="h-6 w-6" strokeWidth={2.4} />}
              isActive={activeManagementTab === 'collections'}
              onClick={() => onManagementChange?.('collections')}
              isCollapsed={isCollapsed}
              mobileCompact
            />
            <NavButton
              label="Finans"
              icon={<PieChart className="h-6 w-6" strokeWidth={2.4} />}
              isActive={activeManagementTab === 'finance'}
              onClick={() => onManagementChange?.('finance')}
              isCollapsed={isCollapsed}
              mobileCompact
            />
            <NavButton
              label="Stok"
              icon={<Boxes className="h-6 w-6" strokeWidth={2.4} />}
              isActive={activeManagementTab === 'inventory'}
              onClick={() => onManagementChange?.('inventory')}
              isCollapsed={isCollapsed}
              mobileCompact
            />
            <NavButton
              label="Takvim"
              icon={<Calendar className="h-6 w-6" strokeWidth={2.4} />}
              isActive={activeManagementTab === 'calendar'}
              onClick={() => onManagementChange?.('calendar')}
              isCollapsed={isCollapsed}
              mobileCompact
            />

            {/* Mobile switch button inside bottom bar */}
            <button
              onClick={onToggleMode}
              className="flex md:hidden flex-1 flex-col items-center gap-1 py-3 text-emerald-600 dark:text-emerald-400 transition-colors"
              aria-label="Saha Moduna Geç"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                <Store className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="text-xs font-bold leading-none">Saha</span>
            </button>
          </>
        ) : (
          <>
            <NavButton
              label="Satış"
              icon={<ShoppingCart className="h-6 w-6" strokeWidth={2.4} />}
              isActive={active === 'sales'}
              onClick={() => onChange('sales')}
              isCollapsed={isCollapsed}
            />
            <NavButton
              label="Stok"
              icon={<Boxes className="h-6 w-6" strokeWidth={2.4} />}
              isActive={active === 'inventory'}
              onClick={() => onChange('inventory')}
              isCollapsed={isCollapsed}
            />
            <NavButton
              label="Geçmiş"
              icon={<History className="h-6 w-6" strokeWidth={2.4} />}
              isActive={active === 'history'}
              onClick={() => onChange('history')}
              isCollapsed={isCollapsed}
            />
            <NavButton
              label="Cüzdan"
              icon={<Wallet className="h-6 w-6" strokeWidth={2.4} />}
              isActive={active === 'wallet'}
              onClick={() => onChange('wallet')}
              isCollapsed={isCollapsed}
            />
            <NavButton
              label="Ödeme"
              icon={<CreditCard className="h-6 w-6" strokeWidth={2.4} />}
              isActive={active === 'payment'}
              onClick={() => onChange('payment')}
              isCollapsed={isCollapsed}
            />
          </>
        )}

        {/* Desktop Sidebar Bottom: Mode Switch & Theme Toggle */}
        <div className="hidden md:flex mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800/80">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 w-full">
              {onToggleMode && (
                <button
                  onClick={onToggleMode}
                  className="flex flex-1 items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/80 p-2.5 text-left transition hover:bg-gray-100 active:scale-98 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 min-w-0"
                  title={mode === 'field' ? 'Yönetim Moduna Geç' : 'Saha Moduna Dön'}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      mode === 'field'
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    }`}
                  >
                    {mode === 'field' ? (
                      <Briefcase className="h-4 w-4" strokeWidth={2.4} />
                    ) : (
                      <Store className="h-4 w-4" strokeWidth={2.4} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      {mode === 'field' ? 'Yönetim' : 'Saha'}
                    </p>
                    <p className="truncate text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                      {mode === 'field' ? 'Panele Geç' : 'Satışa Dön'}
                    </p>
                  </div>
                </button>
              )}

              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label="Tema değiştir"
                  title={theme === 'light' ? 'Koyu Moda Geç' : 'Açık Moda Geç'}
                >
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Sun className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full">
              {onToggleMode && (
                <button
                  onClick={onToggleMode}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title={mode === 'field' ? 'Yönetim Moduna Geç' : 'Saha Moduna Dön'}
                >
                  {mode === 'field' ? (
                    <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" strokeWidth={2.4} />
                  ) : (
                    <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.4} />
                  )}
                </button>
              )}

              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label="Tema değiştir"
                  title={theme === 'light' ? 'Koyu Moda Geç' : 'Açık Moda Geç'}
                >
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Sun className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  label,
  icon,
  isActive,
  onClick,
  isCollapsed = false,
  mobileLabel,
  mobileCompact = false,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
  mobileLabel?: string;
  mobileCompact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-3 transition-colors md:flex-row md:flex-none md:w-full md:gap-3 md:rounded-xl md:hover:bg-gray-50 dark:md:hover:bg-zinc-900/50 ${
        isCollapsed ? 'md:px-0 md:justify-center' : 'md:px-4 md:py-3 md:justify-start'
      } ${
        isActive ? 'text-emerald-600 dark:text-white' : 'text-gray-400 dark:text-zinc-500'
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
          isActive ? 'scale-105 bg-emerald-100 dark:bg-white/10' : 'scale-95'
        }`}
      >
        {icon}
      </span>
      <span
        className={`${mobileCompact ? 'text-[10px] sm:text-xs' : 'text-sm'} font-bold leading-none md:text-base ${
          isCollapsed ? 'md:hidden' : 'md:block'
        }`}
      >
        {mobileLabel ? <><span className="md:hidden">{mobileLabel}</span><span className="hidden md:inline">{label}</span></> : label}
      </span>
    </button>
  );
}
