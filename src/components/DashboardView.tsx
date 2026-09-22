import React from 'react';
import {
  Utensils,
  Package,
  Users,
  Wallet,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2
} from 'lucide-react';
import {
  Member,
  Ingredient,
  Meal,
  MemberFinancialSummary
} from '../types';
import {
  toPersianDigits,
  formatCurrency,
  getTodayJalali,
  buildJalaliMonthCalendar,
  formatUnitQuantity,
  PERSIAN_WEEK_DAYS_SHORT
} from '../utils/jalali';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  todayJalali: ReturnType<typeof getTodayJalali>;
  todayMeal: Meal | undefined;
  ingredients: Ingredient[];
  members: Member[];
  memberSummaries: MemberFinancialSummary[];
  recentMeals: Meal[];
  onOpenNewMeal: (prefilledDate?: string) => void;
  onNavigateTab: (tab: NavTab) => void;
  onSelectMealDetails: (meal: Meal) => void;
  allMeals: Meal[];
  currency?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  todayJalali,
  todayMeal,
  ingredients,
  members,
  memberSummaries,
  recentMeals,
  onOpenNewMeal,
  onNavigateTab,
  onSelectMealDetails,
  allMeals,
  currency = 'تومان'
}) => {
  // Low stock calculation
  const lowStockIngredients = ingredients.filter(
    (i) => i.currentStock <= i.minThresholdStock
  );

  // Total inventory valuation
  const totalInventoryValuation = ingredients.reduce(
    (sum, i) => sum + (i.currentStock > 0 ? i.currentStock * i.averageUnitCost : 0),
    0
  );

  // Active counts
  const activePrimaryCount = members.filter((m) => m.isActive && m.type === 'primary').length;
  const activeSecondaryCount = members.filter((m) => m.isActive && m.type === 'secondary').length;

  // Total credits and debits among all members
  const totalCredits = memberSummaries
    .filter((s) => s.netBalance > 0)
    .reduce((sum, s) => sum + s.netBalance, 0);

  const totalDebits = memberSummaries
    .filter((s) => s.netBalance < 0)
    .reduce((sum, s) => sum + Math.abs(s.netBalance), 0);

  // Month days for mini calendar
  const calendarDays = buildJalaliMonthCalendar(todayJalali.jy, todayJalali.jm);
  const mealsByDate = new Map<string, Meal>();
  allMeals.forEach((m) => mealsByDate.set(m.dateJalali, m));

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Low stock alert banner if any */}
      {lowStockIngredients.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                هشدار کسری موجودی انبار ({toPersianDigits(lowStockIngredients.length)} قلم کالا)
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                موجودی موادی مانند {lowStockIngredients.slice(0, 3).map((i) => i.name).join('، ')} به حداقل مجاز رسیده است.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('purchases')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shrink-0"
          >
            ثبت خرید جدید
          </button>
        </div>
      )}

      {/* Hero: Today's Lunch Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 shadow-md shadow-emerald-900/10">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{todayJalali.readableFa}</span>
            </div>

            {todayMeal ? (
              <div>
                <p className="text-emerald-100 text-xs font-medium">وعده ناهار امروز ثبت شده:</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
                  {todayMeal.title}
                </h2>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-200" />
                    <span>تعداد حاضرین: <strong>{toPersianDigits(todayMeal.participantIds.length)} نفر</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-200" />
                    <span>هزینه کل: <strong>{formatCurrency(todayMeal.totalCost, currency)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>سهم هر نفر: <strong>{formatCurrency(todayMeal.costPerParticipant, currency)}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  هنوز ناهار امروز ثبت نشده است
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md">
                  مواد مصرفی، اعضای حاضر و خریدهای اضافه امروز را به سادگی ثبت کنید تا دنگ و انبار دقیق محاسبه شود.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {todayMeal ? (
              <button
                onClick={() => onSelectMealDetails(todayMeal)}
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>مشاهده و ویرایش جزئیات</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onOpenNewMeal(todayJalali.formatted)}
                className="px-5 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>ثبت ناهار امروز</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Inventory Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ارزش موجودی انبار</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalInventoryValuation, currency)}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              مجموع ارزش {toPersianDigits(ingredients.length)} قلم کالا
            </p>
          </div>
        </div>

        {/* Primary Active Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">اعضای اصلی فعال</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {toPersianDigits(activePrimaryCount)} نفر
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              مشارکت‌کنندگان خریدهای انبار
            </p>
          </div>
        </div>

        {/* Secondary Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">اعضای فرعی فعال</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {toPersianDigits(activeSecondaryCount)} نفر
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              محاسبه سهم صرفاً در وعده‌های مصرفی
            </p>
          </div>
        </div>

        {/* Total Credits & Debits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">مجموع مطالبات / بدهی</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                {formatCurrency(totalCredits, currency)}
              </span>
              <span className="text-[10px] text-slate-400">طلب اعضا</span>
            </div>
            <div className="text-left">
              <span className="text-rose-600 dark:text-rose-400 font-bold block">
                {formatCurrency(totalDebits, currency)}
              </span>
              <span className="text-[10px] text-slate-400">بدهی اعضا</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Mini Calendar Widget + Quick Member Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Calendar View Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                تقویم ناهار ماه جاری ({todayJalali.formattedFa.substring(0, 7)})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده تقویم کامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2">
            {PERSIAN_WEEK_DAYS_SHORT.map((day, idx) => (
              <div key={idx} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.slice(0, 35).map((d, index) => {
              const meal = mealsByDate.get(d.jalaliDate);
              const isToday = d.isToday;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (meal) {
                      onSelectMealDetails(meal);
                    } else {
                      onOpenNewMeal(d.jalaliDate);
                    }
                  }}
                  className={`min-h-[52px] sm:min-h-[60px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : d.isCurrentMonth
                      ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-transparent text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : d.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {toPersianDigits(d.dayNumber)}
                    </span>
                    {meal && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                    )}
                  </div>

                  {meal ? (
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-300 truncate font-semibold bg-emerald-100/60 dark:bg-emerald-900/40 px-1 py-0.5 rounded-sm">
                      {meal.title}
                    </div>
                  ) : (
                    d.isCurrentMonth && (
                      <span className="text-[9px] text-slate-300 dark:text-slate-600">ثبت نشده</span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Balances Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  وضعیت مانده حساب اعضا
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('accounts')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>دفتر کل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {memberSummaries.slice(0, 6).map((summary) => {
                const isCreditor = summary.netBalance > 0;
                const isDebtor = summary.netBalance < 0;
                const isZero = summary.netBalance === 0;

                return (
                  <div
                    key={summary.member.id}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          summary.member.type === 'primary'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        }`}
                      >
                        {summary.member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {summary.member.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {summary.member.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span
                        className={`text-xs font-extrabold dir-ltr inline-block ${
                          isCreditor
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isDebtor
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCreditor && '+'}
                        {formatCurrency(summary.netBalance, currency)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {isCreditor ? 'طلبکار' : isDebtor ? 'بدهکار' : 'تسویه'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between text-xs text-slate-500">
            <button
              onClick={() => onNavigateTab('settlements')}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-center"
            >
              ثبت تسویه حساب جدید
            </button>
          </div>
        </div>
      </div>

      {/* Recent Lunches Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              آخرین وعده‌های ناهار ثبت‌شده
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('calendar')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>مشاهده همه</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMeals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            هنوز هیچ وعده ناهاری ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">تاریخ</th>
                  <th className="py-2.5 px-3">نام غذا</th>
                  <th className="py-2.5 px-3">حاضرین</th>
                  <th className="py-2.5 px-3">هزینه کل ({currency})</th>
                  <th className="py-2.5 px-3">سهم هر نفر ({currency})</th>
                  <th className="py-2.5 px-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentMeals.slice(0, 5).map((meal) => (
                  <tr
                    key={meal.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {toPersianDigits(meal.dateJalali)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {meal.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {toPersianDigits(meal.participantIds.length)} نفر
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(meal.totalCost, currency)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(meal.costPerParticipant, currency)}
                    </td>
                    <td className="py-3 px-3 text-left">
                      <button
                        onClick={() => onSelectMealDetails(meal)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        جزئیات
                      </button>
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
