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
  ShieldCheck,
  HardDrive,
  Monitor,
  Terminal,
  FileCode2,
  FolderArchive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isDesktopApp } from '../desktop';

interface AppExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'direct_install' | 'windows_exe' | 'capacitor_apk' | 'pwabuilder';
}

export const AppExportModal: React.FC<AppExportModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'windows_exe'
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'direct_install' | 'windows_exe' | 'capacitor_apk' | 'pwabuilder'>(defaultTab);
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

  const handleDownloadElectronPackage = () => {
    const electronMain = `const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: 'حسابداری ناهار',
    icon: path.join(__dirname, 'dist', 'pwa-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    autoHideMenuBar: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  const template = [
    {
      label: 'عملیات',
      submenu: [
        { label: 'بارگذاری مجدد (Reload)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'حالت تمام صفحه (Full Screen)', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'خروج از برنامه', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'بزرگ‌نمایی',
      submenu: [
        { label: 'بزرگ‌تر', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'کوچک‌تر', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'اندازه پیش‌فرض (۱۰۰٪)', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

    const blob = new Blob([electronMain], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'electron-main.cjs';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBuildBat = () => {
    const batContent = `@echo off
chcp 65001 > nul
echo ========================================================
echo       ساخت فایل نصبی EXE حسابداری ناهار با Electron
echo ========================================================
echo.

echo 1. در حال بیلد پروژه فرانت‌اند (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [خطا] مرحله بیلد ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. در حال نصب بسته‌های Electron و Builder...
call npm install --save-dev electron electron-builder
if %errorlevel% neq 0 (
    echo [خطا] نصب الکترون ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo 3. در حال تولید فایل Setup EXE برای ویندوز...
call npx electron-builder --win nsis:ia32,x64 --config.directories.output=release
if %errorlevel% neq 0 (
    echo [خطا] تولید فایل EXE ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [تبریک!] فایل نصبی EXE در پوشه release با موفقیت ساخته شد.
echo ========================================================
explorer release
pause
`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-windows-exe.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const windowsSteps = [
    {
      title: 'گام ۱: دریافت پروژه (Export to ZIP)',
      desc: 'از منوی تنظیمات بالای صفحه (آیکون چرخ‌دنده یا منوی سه‌نقطه پروژه در AI Studio)، گزینه Export to ZIP یا دانلود سورس‌کد را انتخاب کنید تا پروژه روی کامپیوترتان باز شود.',
      cmd: '# پس از استخراج فایل زیپ، ترمینال یا CMD را در همان پوشه باز کنید:'
    },
    {
      title: 'گام ۲: نصب بسته‌های الکترون (Electron & Builder)',
      desc: 'الکترون هسته تبدیل برنامه‌های وب به نرم‌افزار دسکتاپ ویندوز است:',
      cmd: 'npm install --save-dev electron electron-builder'
    },
    {
      title: 'گام ۳: ساخت و کامپایل فایل‌های برنامه',
      desc: 'فایل‌های فرانت‌اند بهینه‌سازی شده و در پوشه dist قرار می‌گیرند:',
      cmd: 'npm run build'
    },
    {
      title: 'گام ۴: تولید فایل نصبی ویندوز (.exe Setup)',
      desc: 'با یک دستور، پکیج نصبی استاندارد NSIS ویندوز (۳۲ بیت و ۶۴ بیت) ساخته می‌شود:',
      cmd: 'npx electron-builder --win nsis --config.directories.output=release'
    }
  ];

  const capacitorCommands = [
    { title: '۱. نصب پکیج‌های کپسیتور (Capacitor)', cmd: 'npm install @capacitor/core @capacitor/cli @capacitor/android' },
    { title: '۲. مقداردهی اولیه کپسیتور', cmd: 'npx cap init "حسابداری ناهار" "com.lunchaccounting.app" --web-dir dist' },
    { title: '۳. کامپایل پروژه فرانت‌اند', cmd: 'npm run build' },
    { title: '۴. افزودن پلتفرم اندروید', cmd: 'npx cap add android' },
    { title: '۵. همگام‌سازی فایل‌های بیلد', cmd: 'npx cap sync android' },
    { title: '۶. باز کردن پروژه در اندروید استودیو برای تولید APK', cmd: 'npx cap open android' },
  ];

  return (
    <div
      id="app-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              {activeTab === 'windows_exe' ? (
                <Monitor className="w-6 h-6" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">خروجی نرم‌افزار (ویندوز EXE و اندروید)</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Desktop & Mobile
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تولید فایل نصبی ویندوز (EXE)، نصب PWA دسکتاپ و تلفن همراه، یا خروجی APK برای اندروید
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop-runtime notice */}
        {isDesktopApp() && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>شما در حال اجرای نسخه دسکتاپ (Electron) «حسابداری ناهار» هستید؛ داده‌ها به صورت محلی روی همین دستگاه ذخیره می‌شوند و نیازی به نصب مجدد نیست.</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1.5 gap-1.5">
          <button
            id="tab-windows-exe"
            onClick={() => setActiveTab('windows_exe')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'windows_exe'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>نرم‌افزار ویندوز (EXE)</span>
          </button>

          <button
            id="tab-direct-install"
            onClick={() => setActiveTab('direct_install')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'direct_install'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>نصب مستقیم (PWA موبایل/دسکتاپ)</span>
          </button>

          <button
            id="tab-capacitor-apk"
            onClick={() => setActiveTab('capacitor_apk')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'capacitor_apk'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>خروجی بومی APK</span>
          </button>

          <button
            id="tab-pwabuilder"
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>تبدیل آنلاین APK / Store</span>
          </button>
        </div>

        {/* Tab 1: Windows EXE */}
        {activeTab === 'windows_exe' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Direct PWA desktop install shortcut */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Monitor className="w-5 h-5 text-emerald-200" />
                  <h4 className="font-black text-sm sm:text-base">نصب فوری به عنوان نرم‌افزار دسکتاپ ویندوز</h4>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  بدون نیاز به دانلود فایلی، می‌توانید همین لحظه این برنامه را در مرورگر Chrome یا Edge به صورت یک اپلیکیشن مستقل با آیکون در دسکتاپ و منوی استارت ویندوز نصب کنید.
                </p>
              </div>

              {isInstalled ? (
                <div className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>روی سیستم نصب است</span>
                </div>
              ) : isInstallable ? (
                <button
                  id="install-windows-pwa-btn"
                  onClick={install}
                  className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-black text-xs hover:bg-emerald-50 active:scale-95 transition cursor-pointer shadow-md flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>نصب فوری در ویندوز</span>
                </button>
              ) : (
                <span className="text-[11px] text-emerald-200 bg-black/20 px-3 py-1.5 rounded-lg shrink-0">
                  در کروم یا اج: منوی سه‌نقطه &gt; Cast, save, and share &gt; Install app
                </span>
              )}
            </div>

            {/* True Standalone Installer EXE Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-slate-50 dark:bg-slate-850/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <FolderArchive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      تولید فایل نصب نصبی مستقل (.exe Setup) با Electron
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      مناسب ساخت فایل <code className="font-mono text-emerald-600 dark:text-emerald-400">Setup.exe</code> با قابلیت اجرا در تمامی نسخه‌های ویندوز (Windows 10 / 11)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="download-build-bat-btn"
                    onClick={handleDownloadBuildBat}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="دانلود فایل اجرای خودکار برای ویندوز"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود اسکریپت build-exe.bat</span>
                  </button>
                  <button
                    id="download-electron-main-btn"
                    onClick={handleDownloadElectronPackage}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                    title="دانلود فایل سورس الکترون"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>electron-main.cjs</span>
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="space-y-3">
                {windowsSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 bg-white dark:bg-slate-900 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>{step.title}</span>
                      {step.cmd && !step.cmd.startsWith('#') && (
                        <button
                          id={`copy-win-step-${idx}`}
                          onClick={() => copyToClipboard(step.cmd, idx + 10)}
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 transition cursor-pointer"
                          title="کپی دستور"
                        >
                          {copiedIndex === idx + 10 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                    {step.cmd && (
                      <pre className="dir-ltr text-[11px] font-mono bg-slate-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto select-all">
                        {step.cmd}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                ⚡ <strong>روش سریع با اسکریپت یک‌کلیکه:</strong> پس از دانلود سورس پروژه به صورت ZIP، دکمه <strong>«دانلود اسکریپت build-exe.bat»</strong> را زده و آن را در پوشه پروژه قرار دهید؛ با دو بار کلیک روی آن، به طور کاملاً خودکار فایل <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded text-amber-950 dark:text-amber-200">.exe</code> در پوشه <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded text-amber-950 dark:text-amber-200">release</code> ساخته می‌شود!
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Install Mobile & Desktop */}
        {activeTab === 'direct_install' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold">نصب رسمی به عنوان اپلیکیشن مستقل تحت وب (WebAPK / PWA):</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  این اپلیکیشن کاملاً آفلاین کار می‌کند و پس از نصب، دقیقاً مانند یک برنامه مستقل با آیکون اختصاصی در لیست برنامه‌ها قرار گرفته و تمام صفحه و بدون نوار مرورگر اجرا می‌شود.
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

        {/* Tab 3: Capacitor APK */}
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

        {/* Tab 4: PWABuilder Online APK & Windows Store */}
        {activeTab === 'pwabuilder' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-850 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h4 className="text-sm font-black text-emerald-950 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>تبدیل آنلاین به فایل نصبی ویندوز (MSIX / Store) و اندروید (APK)</span>
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                سرویس رسمی <strong>PWABuilder (ساخت مایکروسافت)</strong> مانیفست و سرویس‌ورکر این برنامه را بررسی کرده و بدون نیاز به نصب هیچ ابزاری، بسته نصبی آماده برای <strong>ویندوز و اندروید</strong> تولید می‌کند.
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
                  وارد سایت <strong>PWABuilder.com</strong> شوید، آدرس را در کادر قرار داده و دکمه Start را بزنید.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  ۳
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  از منوی خروجی، گزینه <strong>Windows</strong> (برای پکیج نصبی کامپیوتر) یا <strong>Android</strong> (برای پکیج نصبی گوشی) را انتخاب و دانلود فرمایید.
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
            مجهز به Electron، استانداردهای آفلاین IndexedDB و Responsive PWA
          </span>
          <button
            id="close-export-modal-bottom-btn"
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
