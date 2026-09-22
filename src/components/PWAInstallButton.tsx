import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppExportModal } from './AppExportModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'windows_exe' | 'direct_install'>('windows_exe');

  const handleOpenModal = (tab: 'windows_exe' | 'direct_install') => {
    setDefaultTab(tab);
    setIsModalOpen(true);
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        handleOpenModal('windows_exe');
      }
    } else {
      handleOpenModal('windows_exe');
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Windows EXE & Desktop button */}
        <button
          id="navbar-windows-export-btn"
          onClick={() => handleOpenModal('windows_exe')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs bg-slate-800 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 border border-slate-700/80 active:scale-95"
          title="خروجی فایل نصبی ویندوز (.exe) یا نصب دسکتاپ"
        >
          <Monitor className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="hidden md:inline">خروجی ویندوز (EXE)</span>
          <span className="md:hidden">ویندوز</span>
        </button>

        {/* Android / Mobile PWA button */}
        <button
          id="navbar-android-install-btn"
          onClick={handleDirectInstall}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
            isInstalled
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 active:scale-95'
          }`}
          title="نصب نسخه موبایل و اندروید (APK / PWA)"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
          <span className="hidden sm:inline">
            {isInstalled ? 'نسخه نصب‌شده' : 'نسخه اندروید'}
          </span>
          <span className="sm:hidden">
            موبایل
          </span>
        </button>
      </div>

      <AppExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={defaultTab}
      />
    </>
  );
};
