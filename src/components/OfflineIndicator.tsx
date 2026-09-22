import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-indicator-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 dark:bg-amber-600/90 text-white px-3.5 py-2 text-xs font-bold shadow-xl backdrop-blur-xs border border-amber-400/30"
      dir="rtl"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
      <span>حالت آفلاین — اطلاعات از پایگاه داده محلی (IndexedDB) خوانده و ذخیره می‌شود.</span>
    </div>
  );
};
