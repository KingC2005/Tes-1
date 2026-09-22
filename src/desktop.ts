/**
 * Desktop (Electron) detection helper.
 * The preload script injects `window.desktopAPI` only when running inside the
 * packaged desktop app, so the UI can adapt (hide PWA install prompts, etc.).
 */
export interface DesktopAppInfo {
  isDesktop: boolean;
  platform: string;
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
}

interface DesktopAPI {
  isDesktop: boolean;
  getAppInfo: () => Promise<DesktopAppInfo>;
}

export function getDesktopAPI(): DesktopAPI | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { desktopAPI?: DesktopAPI }).desktopAPI ?? null;
}

export function isDesktopApp(): boolean {
  return Boolean(getDesktopAPI()?.isDesktop);
}
