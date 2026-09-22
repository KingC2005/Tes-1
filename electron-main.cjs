/**
 * Electron main process — حسابداری ناهار (Lunch Accounting) desktop shell.
 *
 * Features:
 *  - Single instance lock (second launch focuses the existing window)
 *  - Window size/position persistence across restarts
 *  - Persian application menu + zoom/reload shortcuts
 *  - Native "Save As…" dialog for every renderer download (JSON backup, CSV exports)
 *  - External links open in the default browser (never inside the app window)
 *  - Minimal clipboard context menu (copy/paste in text fields)
 *  - Dev-server support: ELECTRON_DEV_SERVER_URL loads the Vite dev server with DevTools
 */
const { app, BrowserWindow, Menu, shell, dialog, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_TITLE = 'حسابداری ناهار';
const isDev = Boolean(process.env.ELECTRON_DEV_SERVER_URL);

// Windows taskbar / notification grouping id
if (process.platform === 'win32') {
  app.setAppUserModelId('com.kingc2005.nahar-accounting');
}

/* ------------------------------------------------------------------ */
/* Window state persistence                                            */
/* ------------------------------------------------------------------ */
function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  const fallback = { width: 1280, height: 850 };
  try {
    const raw = fs.readFileSync(stateFile(), 'utf8');
    const s = JSON.parse(raw);
    if (s && typeof s.width === 'number' && typeof s.height === 'number') return s;
  } catch {
    /* first run or unreadable file */
  }
  return fallback;
}

function saveWindowState(win) {
  try {
    const bounds = win.getNormalBounds ? win.getNormalBounds() : win.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: win.isMaximized(),
    };
    fs.writeFileSync(stateFile(), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
function appIconPath() {
  const candidates =
    process.platform === 'win32'
      ? ['resources/icon.ico', 'dist/pwa-512x512.png']
      : ['resources/icon.png', 'dist/pwa-512x512.png'];
  for (const rel of candidates) {
    const p = path.join(__dirname, rel);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Main window                                                         */
/* ------------------------------------------------------------------ */
let mainWindow = null;

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: Number.isInteger(state.x) ? state.x : undefined,
    y: Number.isInteger(state.y) ? state.y : undefined,
    minWidth: 900,
    minHeight: 650,
    title: APP_TITLE,
    icon: appIconPath(),
    backgroundColor: '#0f172a',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      // The renderer is fully static (localStorage/IndexedDB) — no remote content.
      webSecurity: true,
    },
  });

  if (state.isMaximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());

  /* Native "Save As…" for renderer-initiated downloads (backup JSON, CSV, …) */
  session.defaultSession.on('will-download', (event, item) => {
    const win = BrowserWindow.fromWebContents(item.getWebContents()) || mainWindow;
    const suggested = item.getFilename() || 'export.json';
    const choice = dialog.showSaveDialogSync(win, {
      title: 'ذخیره فایل خروجی',
      defaultPath: path.join(app.getPath('downloads'), suggested),
      filters: [
        { name: 'فایل پشتیبان (JSON)', extensions: ['json'] },
        { name: 'صفحه گسترده (CSV)', extensions: ['csv'] },
        { name: 'همه فایل‌ها', extensions: ['*'] },
      ],
    });
    if (!choice) {
      item.cancel();
      return;
    }
    item.setSavePath(choice);
    item.once('done', (_e, downloadState) => {
      if (downloadState === 'completed') {
        dialog.showMessageBox(win, {
          type: 'info',
          title: APP_TITLE,
          message: 'فایل با موفقیت ذخیره شد.',
          detail: choice,
          buttons: ['باشه'],
        });
      }
    });
  });

  /* Keep navigation inside the app; open anything else in the default browser */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDev
      ? process.env.ELECTRON_DEV_SERVER_URL
      : 'file://';
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  /* Minimal clipboard context menu */
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const { editFlags, isEditable, selectionText } = params;
    const template = [];
    if (selectionText) template.push({ role: 'copy', label: 'کپی (Copy)' });
    if (isEditable) {
      template.push(
        { role: 'cut', label: 'برش (Cut)', enabled: editFlags.canCut },
        { role: 'copy', label: 'کپی (Copy)', enabled: editFlags.canCopy },
        { role: 'paste', label: 'چسباندن (Paste)', enabled: editFlags.canPaste },
        { role: 'selectAll', label: 'انتخاب همه (Select All)' },
      );
    }
    if (template.length) Menu.buildFromTemplate(template).popup({ window: mainWindow });
  });

  /* Load app: dev server or packaged static bundle */
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  buildMenu();

  let saveTimer = null;
  const queueSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveWindowState(mainWindow), 400);
  };
  mainWindow.on('resize', queueSave);
  mainWindow.on('move', queueSave);
  mainWindow.on('maximize', queueSave);
  mainWindow.on('unmaximize', queueSave);
  mainWindow.on('close', () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveWindowState(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/* ------------------------------------------------------------------ */
/* Persian application menu                                            */
/* ------------------------------------------------------------------ */
function buildMenu() {
  const template = [
    {
      label: 'برنامه',
      submenu: [
        {
          label: 'درباره حسابداری ناهار',
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: APP_TITLE,
              message: APP_TITLE,
              detail: `نسخه دسکتاپ (Electron) — نسخه ${app.getVersion()}\nسامانه جامع مدیریت انبار مواد غذایی، ثبت وعده‌های ناهار، محاسبه دنگ و حسابداری اعضا`,
              buttons: ['باشه'],
            }),
        },
        { type: 'separator' },
        { label: 'بارگذاری مجدد (Reload)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
        {
          label: 'حالت تمام صفحه (Full Screen)',
          accelerator: 'F11',
          click: () => mainWindow && mainWindow.setFullScreen(!mainWindow.isFullScreen()),
        },
        {
          label: 'ابزار توسعه‌دهنده (DevTools)',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        { label: 'خروج از برنامه', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'بزرگ‌نمایی',
      submenu: [
        {
          label: 'بزرگ‌تر',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow && mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5),
        },
        {
          label: 'کوچک‌تر',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow && mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5),
        },
        { label: 'اندازه پیش‌فرض (۱۰۰٪)', accelerator: 'CmdOrCtrl+0', click: () => mainWindow && mainWindow.webContents.setZoomLevel(0) },
      ],
    },
    {
      label: 'ویرایش',
      submenu: [
        { role: 'undo', label: 'بازگشت (Undo)' },
        { role: 'redo', label: 'انجام مجدد (Redo)' },
        { type: 'separator' },
        { role: 'cut', label: 'برش (Cut)' },
        { role: 'copy', label: 'کپی (Copy)' },
        { role: 'paste', label: 'چسباندن (Paste)' },
        { role: 'selectAll', label: 'انتخاب همه (Select All)' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ------------------------------------------------------------------ */
/* IPC (used by the renderer through electron-preload.cjs)             */
/* ------------------------------------------------------------------ */
ipcMain.handle('desktop:app-info', () => ({
  isDesktop: true,
  platform: process.platform,
  appVersion: app.getVersion(),
  electronVersion: process.versions.electron,
  chromeVersion: process.versions.chrome,
}));

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
