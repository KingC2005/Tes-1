import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Filter,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  Trash2,
  Edit
} from 'lucide-react';
import { Meal, Member } from '../types';
import {
  toPersianDigits,
  formatCurrency,
  getTodayJalali,
  buildJalaliMonthCalendar,
  PERSIAN_MONTHS,
  PERSIAN_WEEK_DAYS_SHORT,
  formatJalaliReadable
} from '../utils/jalali';

interface CalendarViewProps {
  meals: Meal[];
  members: Member[];
  onOpenNewMeal: (prefilledDate?: string) => void;
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: string) => void;
  currency?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  meals,
  members,
  onOpenNewMeal,
  onEditMeal,
  onDeleteMeal,
  currency = 'تومان'
}) => {
  const today = getTodayJalali();
  const [selectedYear, setSelectedYear] = useState<number>(today.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.jm);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMealDetail, setActiveMealDetail] = useState<Meal | null>(null);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetToToday = () => {
    setSelectedYear(today.jy);
    setSelectedMonth(today.jm);
    setSelectedDateFilter(null);
  };

  const calendarDays = buildJalaliMonthCalendar(selectedYear, selectedMonth);
  const mealsByDate = new Map<string, Meal>();
  meals.forEach((m) => mealsByDate.set(m.dateJalali, m));

  // Filtered list of meals
  const filteredMeals = meals.filter((meal) => {
    if (selectedDateFilter && meal.dateJalali !== selectedDateFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const titleMatch = meal.title.toLowerCase().includes(q);
      const notesMatch = (meal.notes || '').toLowerCase().includes(q);
      const participantMatch = meal.participantSnapshots.some((p) =>
        p.memberName.toLowerCase().includes(q)
      );
      const dateMatch = meal.dateJalali.includes(q);
      if (!titleMatch && !notesMatch && !participantMatch && !dateMatch) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header & Month Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              تقویم و تاریخچه وعده‌های ناهار
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مشاهده وضعیت روزها، برنامه‌ریزی ناهار و جستجو در تاریخچه
            </p>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <button
            onClick={handleResetToToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            برو به امروز
          </button>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="ماه بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-100 whitespace-nowrap">
              {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
            </span>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="ماه قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar on Right/Top, Details on Left/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Full Jalali Calendar Grid (7 columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">
            {PERSIAN_WEEK_DAYS_SHORT.map((day, idx) => (
              <div key={idx} className="py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((d, index) => {
              const meal = mealsByDate.get(d.jalaliDate);
              const isToday = d.isToday;
              const isSelected = selectedDateFilter === d.jalaliDate;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (meal) {
                      setActiveMealDetail(meal);
                    }
                    setSelectedDateFilter((prev) => (prev === d.jalaliDate ? null : d.jalaliDate));
                  }}
                  className={`min-h-[72px] sm:min-h-[88px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                      : isToday
                      ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : d.isCurrentMonth
                      ? 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-transparent text-slate-300 dark:text-slate-700 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center'
                          : d.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {toPersianDigits(d.dayNumber)}
                    </span>
                    {meal && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="ناهار ثبت شده" />
                    )}
                  </div>

                  {meal ? (
                    <div className="mt-1">
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 truncate">
                        {meal.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-0.5">
                        <span>{toPersianDigits(meal.participantIds.length)} نفر</span>
                        <span className="font-semibold">{toPersianDigits(Math.round(meal.totalCost / 1000))}ک</span>
                      </div>
                    </div>
                  ) : d.isCurrentMonth ? (
                    <div className="mt-1 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewMeal(d.jalaliDate);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-opacity"
                        title="ثبت ناهار این روز"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>دارای ناهار</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600" />
                <span>بدون ناهار</span>
              </span>
            </div>
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                نمایش همه روزها
              </button>
            )}
          </div>
        </div>

        {/* Selected Day / Active Meal Preview Panel */}
        <div className="lg:col-span-4 space-y-4">
          {activeMealDetail ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    {formatJalaliReadable(activeMealDetail.dateJalali)}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeMealDetail.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditMeal(activeMealDetail)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="ویرایش وعده"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف وعده ناهار "${activeMealDetail.title}" اطمینان دارید؟ موجودی انبار به حالت قبل بازخواهد گشت.`)) {
                        onDeleteMeal(activeMealDetail.id);
                        setActiveMealDetail(null);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="حذف وعده"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {activeMealDetail.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  {activeMealDetail.notes}
                </p>
              )}

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">هزینه کل وعده</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(activeMealDetail.totalCost, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">سهم هر نفر</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(activeMealDetail.costPerParticipant, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">مواد انبار</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(activeMealDetail.totalInventoryCost, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">خرید اضافه</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(activeMealDetail.totalExtraCost, currency)}
                  </span>
                </div>
              </div>

              {/* Consumed Ingredients */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  مواد اولیه مصرف‌شده:
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeMealDetail.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {ing.ingredientName}
                      </span>
                      <div className="text-left">
                        <span className="text-slate-500 font-bold ml-2">
                          {toPersianDigits(ing.finalQuantity)} {ing.unit}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({formatCurrency(ing.totalCost, currency)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Purchases if any */}
              {activeMealDetail.extraPurchases.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    خریدهای اضافه وعده:
                  </h4>
                  <div className="space-y-1.5">
                    {activeMealDetail.extraPurchases.map((ep) => (
                      <div
                        key={ep.id}
                        className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-2 rounded-xl text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-200 block">
                            {ep.name}
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            خریدار: {ep.buyerMemberName}
                          </span>
                        </div>
                        <span className="font-extrabold text-amber-800 dark:text-amber-300">
                          {formatCurrency(ep.totalCost, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اعضای حاضر ({toPersianDigits(activeMealDetail.participantSnapshots.length)} نفر):
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeMealDetail.participantSnapshots.map((p) => (
                    <span
                      key={p.memberId}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {p.memberName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xs">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                انتخاب روز یا وعده ناهار
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                برای مشاهده جزئیات مواد و دنگ‌ها یا ثبت ناهار جدید، روی هر یک از خانه‌های تقویم کلیک کنید.
              </p>
              <button
                onClick={() => onOpenNewMeal(selectedDateFilter || today.formatted)}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت وعده ناهار جدید</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History and Search Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              تاریخچه تمام وعده‌های ناهار ({toPersianDigits(filteredMeals.length)} وعده)
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در غذاها، افراد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {filteredMeals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            وعده ناهاری مطابق با فیلتر یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">تاریخ شمسی</th>
                  <th className="py-2.5 px-3">نام غذا</th>
                  <th className="py-2.5 px-3">تعداد حاضرین</th>
                  <th className="py-2.5 px-3">هزینه مواد انبار ({currency})</th>
                  <th className="py-2.5 px-3">خریدهای اضافه ({currency})</th>
                  <th className="py-2.5 px-3">هزینه کل ({currency})</th>
                  <th className="py-2.5 px-3">سهم هر نفر ({currency})</th>
                  <th className="py-2.5 px-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredMeals.map((meal) => (
                  <tr
                    key={meal.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {toPersianDigits(meal.dateJalali)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {meal.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {toPersianDigits(meal.participantIds.length)} نفر
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatCurrency(meal.totalInventoryCost, currency)}
                    </td>
                    <td className="py-3 px-3 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatCurrency(meal.totalExtraCost, currency)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(meal.totalCost, currency)}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(meal.costPerParticipant, currency)}
                    </td>
                    <td className="py-3 px-3 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveMealDetail(meal)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors cursor-pointer text-[11px]"
                        >
                          مشاهده
                        </button>
                        <button
                          onClick={() => onEditMeal(meal)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
