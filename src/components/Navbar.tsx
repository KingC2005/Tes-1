import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  UtensilsCrossed,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  BookOpen,
  BarChart3,
  Receipt,
  Download,
  Settings,
  Moon,
  Sun,
  Plus
} from 'lucide-react';
import { toPersianDigits } from '../utils/jalali';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab =
  | 'dashboard'
  | 'calendar'
  | 'meals'
  | 'inventory'
  | 'purchases'
  | 'members'
  | 'accounts'
  | 'recipes'
  | 'reports'
  | 'settlements'
  | 'backup'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewMeal: () => void;
  todayJalaliReadable: string;
  isDark: boolean;
  onToggleTheme: () => void;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewMeal,
  todayJalaliReadable,
  isDark,
  onToggleTheme,
  lowStockCount
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'calendar', label: 'تقویم ناهار', icon: <Calendar className="w-5 h-5" /> },
    { id: 'inventory', label: 'انبار', icon: <Package className="w-5 h-5" />, badge: lowStockCount },
    { id: 'purchases', label: 'خریدها', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'members', label: 'اعضا', icon: <Users className="w-5 h-5" /> },
    { id: 'accounts', label: 'حساب‌ها', icon: <Wallet className="w-5 h-5" /> },
    { id: 'recipes', label: 'غذاها', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'reports', label: 'گزارش‌ها', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settlements', label: 'تسویه حساب', icon: <Receipt className="w-5 h-5" /> },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: <Download className="w-5 h-5" /> },
    { id: 'settings', label: 'تنظیمات', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                حسابداری و مدیریت ناهار
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {todayJalaliReadable}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={onOpenNewMeal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              title="ثبت وعده ناهار جدید"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">ثبت ناهار</span>
            </button>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDark ? 'حالت روز' : 'حالت شب'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Tabs Horizontal Scrollable Bar */}
        <div className="hidden lg:block border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-reverse space-x-1 py-1.5 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-white text-emerald-700'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {toPersianDigits(item.badge)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {toPersianDigits(item.badge)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
