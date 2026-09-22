import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Database,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { AppDatabaseState } from '../types';
import { toPersianDigits, getTodayJalali } from '../utils/jalali';

interface BackupViewProps {
  onExportJson: () => void;
  onImportJson: (jsonString: string) => boolean;
  onResetDemoData: () => void;
  dbState: AppDatabaseState;
}

export const BackupView: React.FC<BackupViewProps> = ({
  onExportJson,
  onImportJson,
  onResetDemoData,
  dbState
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = onImportJson(text);
        if (success) {
          setImportStatus('اطلاعات با موفقیت بازیابی شد.');
        } else {
          setImportStatus('خطا: فرمت فایل پشتیبان معتبر نیست.');
        }
      } catch (err) {
        setImportStatus('خطا در خواندن فایل.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              پشتیبان‌گیری و انتقال داده‌ها (Backup & Restore)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              استخراج کل اطلاعات در قالب JSON، بازگردانی فایل‌های پشتیبان و خروجی‌ها
            </p>
          </div>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Database Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">تعداد اعضا</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {toPersianDigits(dbState.members.length)} نفر
          </strong>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">اقلام انبار</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {toPersianDigits(dbState.ingredients.length)} قلم
          </strong>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">وعده‌های ناهار ثبت‌شده</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {toPersianDigits(dbState.meals.length)} وعده
          </strong>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">تراکنش‌های دفتر کل</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {toPersianDigits(dbState.transactions.length)} تراکنش
          </strong>
        </div>
      </div>

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <FileJson className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                دریافت فایل پشتیبان کامل (Export JSON)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تمام اطلاعات اعضا، انبار، فاکتورهای خرید، وعده‌های ناهار، خریدهای اضافه، تسویه‌ها و تراکنش‌های حساب در یک فایل JSON امن ذخیره می‌شود. می‌توانید این فایل را در هر دستگاه دیگری بارگذاری کنید.
            </p>
          </div>

          <button
            onClick={onExportJson}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل پشتیبان (JSON)</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                بازگردانی فایل پشتیبان (Restore JSON)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              فایل JSON قبلی را انتخاب کنید تا تمام داده‌ها و حساب‌ها جایگزین و احیا شوند. لطفاً قبل از این کار از اطلاعات فعلی نسخه پشتیبان تهیه کنید.
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>انتخاب و بارگذاری فایل پشتیبان</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset to Demo Data */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>بازنشانی به داده‌های اولیه نمونه (Reset Demo Data)</span>
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
            با این کار کلیه اطلاعات فعلی پاک شده و داده‌های آزمایشی استاندارد (اعضا، انبار اولیه، دستورهای غذا) بارگذاری می‌شود.
          </p>
        </div>

        <button
          onClick={() => {
            if (
              confirm(
                'آیا مطمئن هستید؟ تمام تغییرات شما پاک شده و پایگاه داده با داده‌های نمونه بازنویسی خواهد شد.'
              )
            ) {
              onResetDemoData();
            }
          }}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی به دمو</span>
        </button>
      </div>
    </div>
  );
};
