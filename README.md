# حسابداری ناهار (Lunch Accounting)

سامانه جامع مدیریت انبار مواد غذایی، ثبت وعده‌های ناهار، محاسبه دنگ و حسابداری اعضا — یک اپلیکیشن React/TypeScript کاملاً آفلاین (PWA) با پوسته دسکتاپ Electron برای ویندوز.

## امکانات

- داشبورد و تقویم شمسی ثبت وعده‌های ناهار
- مدیریت انبار مواد غذایی، خریدها و محاسبه بهای تمام‌شده (میانگین وزن‌دار)
- اعضا، حساب‌ها، تسویه حساب و گزارش‌ها
- پشتیبان‌گیری/بازیابی JSON و خروجی CSV
- نسخه دسکتاپ ویندوز (Electron) با اجرای کاملاً آفلاین

## شروع کار (وب / توسعه)

```bash
npm install
npm run dev        # سرور توسعه روی پورت 3000
npm run build      # بیلد وب + PWA
```

## نسخه دسکتاپ (ویندوز)

```bash
npm install
npm run desktop    # اجرای سریع دسکتاپ بدون بسته‌بندی
npm run dist:win   # تولید Setup و Portable در پوشه release
```

در ویندوز کافی است `build-windows-exe.bat` را دوبار کلیک کنید. جزئیات بیشتر در [WINDOWS_EXE_GUIDE.md](./WINDOWS_EXE_GUIDE.md).

خروجی‌ها:

- `release/NaharAccounting-Setup-<version>.exe` — نصب‌کننده NSIS
- `release/NaharAccounting-Portable-<version>.exe` — نسخه پرتابل

## ساختار پروژه

| مسیر | توضیح |
| --- | --- |
| `src/` | کد اپلیکیشن React (کامپوننت‌ها، موتور محاسبات، ذخیره‌سازی محلی) |
| `electron-main.cjs` | پوسته دسکتاپ Electron (پنجره، منوی فارسی، Save As بومی) |
| `electron-preload.cjs` | پل ارتباطی امن renderer ↔ main |
| `electron-builder.yml` | پیکربندی بسته‌بندی ویندوز/لینوکس |
| `scripts/make-icon.mjs` | تولید آیکون‌های `resources/icon.ico` و `icon.png` از `public/icon.svg` |
| `.github/workflows/build-windows.yml` | بیلد خودکار exe در GitHub Actions |

## مجوز

استفاده شخصی/داخلی — تمام حقوق برای سازنده محفوظ است.
