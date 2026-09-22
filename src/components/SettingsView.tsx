import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Layers,
  Coins,
  CheckCircle2,
  Moon,
  Sun,
  Info,
  Smartphone,
  Download,
  Monitor
} from 'lucide-react';
import { AppSettings } from '../types';
import { AppExportModal } from './AppExportModal';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  isDark,
  onToggleTheme
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'windows_exe' | 'direct_install'>('windows_exe');
  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              تنظیمات سیستم و پیکربندی انبار
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مدیریت قوانین مالی، موجودی منفی، واحد پول و ظاهر برنامه
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
        {/* Allow negative inventory toggle */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                اجازه ثبت وعده در صورت کسری موجودی انبار
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl">
              در صورت فعال بودن، در صورتی که موجودی انبار برای ثبت یک ناهار کافی نباشد، برنامه ثبت وعده را بلاک نمی‌کند و موجودی منفی یا هشدار نمایش داده می‌شود. در صورت غیرفعال بودن، باید قبل از ثبت نهایی، خرید اضافه یا خرید انبار برای کسری ثبت گردد.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.allowNegativeInventory}
              onChange={(e) =>
                onUpdateSettings({ allowNegativeInventory: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Inventory Valuation Method */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                روش قیمت‌گذاری و ارزیابی موجودی انبار
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ارزیابی بر مبنای استاندارد حسابداری میانگین موزون (Weighted Average Cost) با دقت کامل اعشاری در محاسبات و تبدیل بدون خطای ریال/تومان انجام می‌شود.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold whitespace-nowrap">
            میانگین موزون
          </span>
        </div>

        {/* Currency Unit */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                واحد پولی اصلی برنامه
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تغییر واحد نمایش مبالغ و دنگ‌ها در کلیه بخش‌ها و فاکتورها بین تومان و ریال (هر تومان = ۱۰ ریال).
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onUpdateSettings({ currency: 'تومان' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                (settings.currency || 'تومان') === 'تومان'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              تومان
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ currency: 'ریال' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                settings.currency === 'ریال'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ریال
            </button>
          </div>
        </div>

        {/* Desktop EXE & Android App Export Section */}
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                خروجی نرم‌افزار ویندوز (EXE) و نسخه اندروید (APK / PWA)
              </h3>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              تولید فایل نصبی خودکار ویندوز (.exe Setup با Electron)، نصب مستقل در دسکتاپ و موبایل، یا خروجی APK بومی.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="settings-open-windows-modal-btn"
              onClick={() => {
                setModalDefaultTab('windows_exe');
                setIsExportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-400" />
              <span>خروجی ویندوز (EXE)</span>
            </button>

            <button
              id="settings-open-android-modal-btn"
              onClick={() => {
                setModalDefaultTab('direct_install');
                setIsExportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>نسخه اندروید</span>
            </button>
          </div>
        </div>

        {/* Theme Mode */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                حالت ظاهری (تم شب / روز)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تغییر پوسته برنامه بین حالت روشن (Material 3 Light) و حالت تیره (Dark Mode).
            </p>
          </div>

          <button
            onClick={onToggleTheme}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? 'تغییر به روز' : 'تغییر به شب'}
          </button>
        </div>

        {/* Application Information */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                درباره نرم‌افزار
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              سیستم جامع حسابداری و مدیریت ناهار سازمانی و اداری - کاملاً آفلاین و ایمن در مرورگر
            </p>
          </div>

          <span className="text-xs font-bold text-slate-400">
            نسخه ۱.۰.۰
          </span>
        </div>
      </div>

      <AppExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultTab={modalDefaultTab}
      />
    </div>
  );
};
