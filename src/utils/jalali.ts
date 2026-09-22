import * as jalaali from 'jalaali-js';
import { UnitType } from '../types';

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const PERSIAN_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه'
];

export const PERSIAN_WEEK_DAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

let activeAppCurrency: string = 'تومان';

export function setActiveAppCurrency(currency: string): void {
  if (currency === 'ریال' || currency === 'تومان') {
    activeAppCurrency = currency;
  }
}

export function getActiveAppCurrency(): string {
  return activeAppCurrency || 'تومان';
}

/**
 * Converts user input amount (entered in active currency) to internal base amount (Toman)
 */
export function toBaseAmount(inputAmount: number, currency?: string): number {
  const curr = currency || activeAppCurrency;
  if (curr === 'ریال') {
    return Math.round(inputAmount / 10);
  }
  return inputAmount;
}

/**
 * Converts internal base amount (Toman) to active display/input currency amount
 */
export function fromBaseAmount(baseAmount: number, currency?: string): number {
  const curr = currency || activeAppCurrency;
  if (curr === 'ریال') {
    return baseAmount * 10;
  }
  return baseAmount;
}

/**
 * Formats a number with comma separators, Persian digits, and currency conversion
 * 1 Toman = 10 Rials
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency?: 'تومان' | 'ریال' | string,
  showUnit = true
): string {
  const activeCurrency = currency || activeAppCurrency || 'تومان';
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showUnit ? `۰ ${activeCurrency}` : '۰';
  }
  const isRial = activeCurrency === 'ریال';
  const numericVal = isRial ? amount * 10 : amount;
  const rounded = Math.round(numericVal);
  const formatted = Math.abs(rounded).toLocaleString('en-US');
  const sign = rounded < 0 ? 'منفی ' : '';
  const withPersianDigits = toPersianDigits(formatted);
  return `${sign}${withPersianDigits}${showUnit ? ` ${activeCurrency}` : ''}`;
}

/**
 * Formats a number with comma separators and Persian digits (respects active currency)
 */
export function formatToman(
  amount: number | null | undefined,
  showUnit = true,
  currency?: 'تومان' | 'ریال' | string
): string {
  return formatCurrency(amount, currency || activeAppCurrency, showUnit);
}

/**
 * Converts a number to Persian words (مبلغ به حروف) for official invoices/factors
 */
export function numberToPersianWords(
  amount: number | null | undefined,
  currency?: string
): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount === 0) return 'صفر';
  
  const activeCurrency = currency || activeAppCurrency || 'تومان';
  const isRial = activeCurrency === 'ریال';
  const actualAmount = isRial ? amount * 10 : amount;

  const yekan = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const dahha = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const dahha10 = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const sadha = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const scale = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  let num = Math.abs(Math.round(actualAmount));
  const parts: string[] = [];
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const c100 = Math.floor(chunk / 100);
      const c10 = Math.floor((chunk % 100) / 10);
      const c1 = chunk % 10;
      const subParts: string[] = [];

      if (c100 > 0) subParts.push(sadha[c100]);
      if (c10 === 1) {
        subParts.push(dahha10[c1]);
      } else {
        if (c10 > 0) subParts.push(dahha[c10]);
        if (c1 > 0) subParts.push(yekan[c1]);
      }
      let chunkStr = subParts.join(' و ');
      if (scale[scaleIndex]) {
        chunkStr += ' ' + scale[scaleIndex];
      }
      parts.unshift(chunkStr);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  const sign = actualAmount < 0 ? 'منفی ' : '';
  return sign + parts.join(' و ');
}

/**
 * Get current today Jalali date
 */
export function getTodayJalali(): {
  jy: number;
  jm: number;
  jd: number;
  formatted: string; // e.g. "1405/07/05"
  formattedFa: string; // e.g. "۱۴۰۵/۰۷/۰۵"
  readableFa: string; // e.g. "شنبه ۵ مهر ۱۴۰۵"
  isoString: string;
} {
  const now = new Date();
  const { jy, jm, jd } = jalaali.toJalaali(now);
  const formatted = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  
  // Calculate day of week: Saturday = 0 in Persian
  // JS getDay(): Sunday = 0, Monday = 1, ... Saturday = 6
  const jsDay = now.getDay();
  const persianDayIndex = (jsDay + 1) % 7;
  const dayName = PERSIAN_WEEK_DAYS[persianDayIndex];
  const monthName = PERSIAN_MONTHS[jm - 1];

  return {
    jy,
    jm,
    jd,
    formatted,
    formattedFa: toPersianDigits(formatted),
    readableFa: `${dayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`,
    isoString: now.toISOString().split('T')[0]
  };
}

/**
 * Convert ISO Date string (YYYY-MM-DD) to Jalali formatted string
 */
export function isoToJalali(isoString: string): string {
  try {
    const parts = isoString.split('-');
    if (parts.length < 3) return isoString;
    const gy = parseInt(parts[0], 10);
    const gm = parseInt(parts[1], 10);
    const gd = parseInt(parts[2], 10);
    const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  } catch {
    return isoString;
  }
}

/**
 * Convert Jalali string (YYYY/MM/DD) to ISO Date string (YYYY-MM-DD)
 */
export function jalaliToIso(jalaliStr: string): string {
  try {
    const parts = jalaliStr.replace(/[^0-9/]/g, '').split('/');
    if (parts.length < 3) return new Date().toISOString().split('T')[0];
    const jy = parseInt(parts[0], 10);
    const jm = parseInt(parts[1], 10);
    const jd = parseInt(parts[2], 10);
    const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Format Jalali string into readable Persian date (e.g. "۵ مهر ۱۴۰۵")
 */
export function formatJalaliReadable(jalaliStr: string): string {
  if (!jalaliStr) return '';
  const parts = jalaliStr.split('/');
  if (parts.length < 3) return toPersianDigits(jalaliStr);
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  const monthName = PERSIAN_MONTHS[jm - 1] || '';
  return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Calendar month structure builder
 */
export interface JalaliCalendarDay {
  dayNumber: number;
  jalaliDate: string; // "1405/07/05"
  isoDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeekIndex: number; // 0 = شنبه, 6 = جمعه
}

export function buildJalaliMonthCalendar(jy: number, jm: number): JalaliCalendarDay[] {
  const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);
  const today = getTodayJalali();

  // Find start day of the week for 1st of this month
  const firstDayGregorian = jalaali.toGregorian(jy, jm, 1);
  const firstDateObj = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  const jsDay = firstDateObj.getDay();
  // In Persian calendar: Saturday is 0, Sunday is 1, ..., Friday is 6
  const startDayOfWeek = (jsDay + 1) % 7;

  const result: JalaliCalendarDay[] = [];

  // Previous month filler days
  if (startDayOfWeek > 0) {
    const prevMonth = jm === 1 ? 12 : jm - 1;
    const prevYear = jm === 1 ? jy - 1 : jy;
    const prevMonthDays = jalaali.jalaaliMonthLength(prevYear, prevMonth);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const jDate = `${prevYear}/${String(prevMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
      const iso = jalaliToIso(jDate);
      result.push({
        dayNumber: d,
        jalaliDate: jDate,
        isoDate: iso,
        isCurrentMonth: false,
        isToday: jDate === today.formatted,
        dayOfWeekIndex: result.length % 7
      });
    }
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const jDate = `${jy}/${String(jm).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    const iso = jalaliToIso(jDate);
    result.push({
      dayNumber: d,
      jalaliDate: jDate,
      isoDate: iso,
      isCurrentMonth: true,
      isToday: jDate === today.formatted,
      dayOfWeekIndex: result.length % 7
    });
  }

  // Next month filler days (fill up to full rows of 7, up to 35 or 42)
  const remaining = (7 - (result.length % 7)) % 7;
  const nextMonth = jm === 12 ? 1 : jm + 1;
  const nextYear = jm === 12 ? jy + 1 : jy;
  for (let d = 1; d <= remaining; d++) {
    const jDate = `${nextYear}/${String(nextMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    const iso = jalaliToIso(jDate);
    result.push({
      dayNumber: d,
      jalaliDate: jDate,
      isoDate: iso,
      isCurrentMonth: false,
      isToday: jDate === today.formatted,
      dayOfWeekIndex: result.length % 7
    });
  }

  return result;
}

/**
 * Unit helpers and conversion
 */
export const UNIT_LABELS: Record<UnitType, string> = {
  g: 'گرم',
  kg: 'کیلوگرم',
  ml: 'میلی‌لیتر',
  l: 'لیتر',
  piece: 'عدد',
  pack: 'بسته',
  bottle: 'بطری'
};

export function formatUnitQuantity(quantity: number, unit: UnitType): string {
  // If unit is g and >= 1000, can display nicely in kg, etc.
  if (unit === 'g') {
    if (quantity >= 1000) {
      const inKg = quantity / 1000;
      return `${toPersianDigits(parseFloat(inKg.toFixed(2)))} کیلوگرم (${toPersianDigits(quantity)} گرم)`;
    }
    return `${toPersianDigits(quantity)} گرم`;
  }
  if (unit === 'ml') {
    if (quantity >= 1000) {
      const inL = quantity / 1000;
      return `${toPersianDigits(parseFloat(inL.toFixed(2)))} لیتر (${toPersianDigits(quantity)} میلی‌لیتر)`;
    }
    return `${toPersianDigits(quantity)} میلی‌لیتر`;
  }
  return `${toPersianDigits(quantity)} ${UNIT_LABELS[unit] || unit}`;
}
