import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'direct_install' | 'capacitor_apk' | 'pwabuilder'>('direct_install');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleDownloadCapacitorConfig = () => {
    const config = {
      appId: 'com.lunchaccounting.app',
      appName: 'حسابداری ناهار',
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        androidScheme: 'https'
      },
      plugins: {
        SplashScreen: {
          launchShowDuration: 1800,
          backgroundColor: '#0f172a'
        }
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capacitor.config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const capacitorCommands = [
    { title: '۱. نصب پکیج‌های کپسیتور (Capacitor)', cmd: 'npm install @capacitor/core @capacitor/cli @capacitor/android' },
    { title: '۲. مقداردهی اولیه پیکربندی کپسیتور', cmd: 'npx cap init "حسابداری ناهار" "com.lunchaccounting.app" --web-dir dist' },
    { title: '۳. کامپایل پروژه فرانت‌اند', cmd: 'npm run build' },
    { title: '۴. افزودن پلتفرم بومی اندروید به پروژه', cmd: 'npx cap add android' },
    { title: '۵. همگام‌سازی فایل‌های بیلد با پوشه اندروید', cmd: 'npx cap sync android' },
    { title: '۶. باز کردن پروژه در اندروید استودیو جهت خروجی گرفتن فایل APK', cmd: 'npx cap open android' },
  ];

  return (
    <div
      id="android-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">خروجی و نصب نسخه اندروید</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android & PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                نصب مستقیم به صورت اپ مستقل (PWA) یا خروجی فایل نصبی APK برای کافه‌بازار و گوگل‌پلی
              </p>
            </div>
          </div>
          <button
            id="close-android-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1.5 gap-1.5">
          <button
            id="tab-direct-install"
            onClick={() => setActiveTab('direct_install')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'direct_install'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>نصب مستقیم روی گوشی</span>
          </button>

          <button
            id="tab-capacitor-apk"
            onClick={() => setActiveTab('capacitor_apk')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'capacitor_apk'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>خروجی فایل APK بومی</span>
          </button>

          <button
            id="tab-pwabuilder"
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>تبدیل آنلاین به APK</span>
          </button>
        </div>

        {/* Tab 1: Direct Install */}
        {activeTab === 'direct_install' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold">نصب رسمی به عنوان اپلیکیشن مستقل تحت وب (WebAPK / PWA):</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  این اپلیکیشن کاملاً آفلاین کار می‌کند و پس از نصب، دقیقاً مانند یک اپ اندرویدی با آیکون اختصاصی در لیست برنامه‌ها قرار گرفته و تمام صفحه و بدون نوار مرورگر اجرا می‌شود.
                </p>
              </div>
            </div>

            {/* Live Install Action Button */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>برنامه در حال حاضر روی این دستگاه نصب شده و فعال است!</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  می‌توانید از طریق صفحه اصلی یا منوی برنامه‌های گوشی مستقیماً وارد شوید.
                </p>
              </div>
            ) : isInstallable ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/20">
                <div className="text-center sm:text-right">
                  <h4 className="font-black text-sm sm:text-base">نصب یک‌کلیکه روی این دستگاه</h4>
                  <p className="text-xs text-emerald-100 mt-0.5">آماده نصب خودکار روی دستگاه شما</p>
                </div>
                <button
                  id="pwa-native-install-prompt-btn"
                  onClick={install}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-emerald-800 font-black text-sm hover:bg-emerald-50 active:scale-95 transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>همین حالا نصب کن</span>
                </button>
              </div>
            ) : null}

            {/* Step by Step Manual Guide for Android & iOS */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span>مراحل نصب روی گوشی اندروید با مرورگر گوگل کروم (Google Chrome):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center">
                    ۱
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">باز کردن لینک</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    لینک این سامانه را در مرورگر کروم گوشی اندرویدی خود باز کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center">
                    ۲
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">منوی سه‌نقطه</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    روی علامت سه نقطه بالا یا پایین صفحه در مرورگر ضربه بزنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center">
                    ۳
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">افزودن به صفحه اصلی</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    گزینه <strong>«افزودن به صفحه اصلی»</strong> یا <strong>«Install app»</strong> را انتخاب نمایید.
                  </p>
                </div>
              </div>

              {isIOS && (
                <div className="mt-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-xs text-sky-900 dark:text-sky-200">
                  <p className="font-bold">نصب در آیفون / آیپد (iOS Safari):</p>
                  <p className="text-[11px] mt-1 text-sky-800 dark:text-sky-300">
                    دکمه Share (مربع با فلش رو به بالا) را در سافاری بزنید و سپس گزینه <strong>«Add to Home Screen»</strong> را لمس فرمایید.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Share URL */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400 truncate dir-ltr select-all">
                {currentUrl}
              </span>
              <button
                id="copy-current-app-url-btn"
                onClick={() => copyToClipboard(currentUrl, 99)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 shrink-0 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {copiedIndex === 99 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی آدرس</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Capacitor APK */}
        {activeTab === 'capacitor_apk' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <span>ساخت فایل خروجی APK با فریمورک رسمی Capacitor</span>
                </span>
                <button
                  id="download-capacitor-json-btn"
                  onClick={handleDownloadCapacitorConfig}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود capacitor.config.json</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                با اجرای دستورات زیر در ترمینال سیستم خود، پروژه مستقیماً به یک پروژه بومی اندروید استودیو (Native Android Studio Project) تبدیل شده و می‌توانید فایل نهایی <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">.apk</code> یا <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">.aab</code> را تحویل بگیرید:
              </p>
            </div>

            <div className="space-y-3">
              {capacitorCommands.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{item.title}</span>
                    <button
                      id={`copy-cap-cmd-${idx}`}
                      onClick={() => copyToClipboard(item.cmd, idx)}
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 transition cursor-pointer"
                      title="کپی دستور"
                    >
                      {copiedIndex === idx ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="dir-ltr text-[11px] font-mono bg-slate-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto select-all">
                    {item.cmd}
                  </pre>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              💡 <strong>نکته:</strong> پس از اجرای دستور نهایی، پروژه در Android Studio باز می‌شود. از منوی <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> فایل خروجی APK بلافاصله تولید خواهد شد.
            </div>
          </div>
        )}

        {/* Tab 3: PWABuilder Online APK */}
        {activeTab === 'pwabuilder' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-850 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h4 className="text-sm font-black text-emerald-950 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>ساخت آنلاین فایل APK بدون نیاز به نصب هیچ نرم‌افزاری</span>
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                سرویس رسمی <strong>PWABuilder (ساخت مایکروسافت و پشتیبانی گوگل)</strong> فایل مانیفست و سرویس‌ورکر این برنامه را بررسی کرده و در ۱ دقیقه فایل آماده <strong>APK و AAB امضاشده برای انتشار در بازار و مایکت</strong> تولید می‌کند.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  ۱
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  آدرس اینترنتی سامانه را کپی کنید.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  ۲
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  وارد سایت <strong>PWABuilder.com</strong> شوید و آدرس را در کادر اصلی وارد کنید و دکمه Start را بزنید.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  ۳
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  در بخش <strong>Android</strong> روی <strong>Package for Store</strong> کلیک کرده و فایل APK یا بسته نصبی را دانلود کنید.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                id="open-pwabuilder-link"
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <span>ورود به سایت PWABuilder</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            طراحی شده با استانداردهای PWA، ذخیره‌سازی آفلاین IndexedDB و Responsive
          </span>
          <button
            id="close-android-modal-bottom-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
