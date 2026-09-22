import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { Meal, Purchase, Member, MemberFinancialSummary } from '../types';
import {
  toPersianDigits,
  formatCurrency,
  getTodayJalali,
  PERSIAN_MONTHS
} from '../utils/jalali';

interface ReportsViewProps {
  meals: Meal[];
  purchases: Purchase[];
  members: Member[];
  memberSummaries: MemberFinancialSummary[];
  currency?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  meals,
  purchases,
  members,
  memberSummaries,
  currency = 'تومان'
}) => {
  const today = getTodayJalali();
  const [selectedYear, setSelectedYear] = useState<number>(today.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.jm);

  // Month prefix string like "1405/07"
  const monthPrefix = `${selectedYear}/${String(selectedMonth).padStart(2, '0')}`;

  // Filter meals in month
  const monthMeals = useMemo(
    () => meals.filter((m) => m.dateJalali.startsWith(monthPrefix)),
    [meals, monthPrefix]
  );

  // Filter purchases in month
  const monthPurchases = useMemo(
    () => purchases.filter((p) => p.dateJalali.startsWith(monthPrefix)),
    [purchases, monthPrefix]
  );

  // Calculations
  const totalMealCost = monthMeals.reduce((sum, m) => sum + m.totalCost, 0);
  const totalInventoryConsumedCost = monthMeals.reduce((sum, m) => sum + m.totalInventoryCost, 0);
  const totalExtraPurchasedCost = monthMeals.reduce((sum, m) => sum + m.totalExtraCost, 0);
  const totalBulkPurchased = monthPurchases.reduce((sum, p) => sum + (p.totalPrice || p.totalCost || 0), 0);
  const totalAttendanceCount = monthMeals.reduce((sum, m) => sum + m.participantIds.length, 0);
  const avgCostPerPerson = totalAttendanceCount > 0 ? Math.round(totalMealCost / totalAttendanceCount) : 0;

  // Member stats in selected month
  const memberMonthlyStats = useMemo(() => {
    return members.map((member) => {
      let attendedCount = 0;
      let totalMealShare = 0;

      monthMeals.forEach((meal) => {
        const pSnap = meal.participantSnapshots.find((p) => p.memberId === member.id);
        if (pSnap) {
          attendedCount += 1;
          totalMealShare += (pSnap.finalShare ?? pSnap.shareAmount ?? 0);
        }
      });

      // Total payments in month
      let totalPaidInMonth = 0;
      monthPurchases.forEach((p) => {
        if (p.buyerMemberId === member.id) {
          totalPaidInMonth += (p.totalPrice || p.totalCost || 0);
        }
      });

      monthMeals.forEach((m) => {
        m.extraPurchases.forEach((ep) => {
          if (ep.buyerMemberId === member.id) {
            totalPaidInMonth += ep.totalCost;
          }
        });
      });

      const overallSummary = memberSummaries.find((s) => s.member.id === member.id);

      return {
        member,
        attendedCount,
        totalMealShare,
        totalPaidInMonth,
        overallNetBalance: overallSummary ? overallSummary.netBalance : 0
      };
    });
  }, [members, monthMeals, monthPurchases, memberSummaries]);

  // Export CSV
  const handleExportCSV = () => {
    const isRial = currency === 'ریال';
    const multiplier = isRial ? 10 : 1;
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'گزارش ماهانه حسابداری ناهار - ' + PERSIAN_MONTHS[selectedMonth - 1] + ' ' + selectedYear + '\n\n';
    csv += `نام عضو,نوع عضویت,تعداد وعده حضور,مجموع سهم ناهار (${currency}),مجموع پرداختی در ماه (${currency}),مانده کل حساب (${currency})\n`;

    memberMonthlyStats.forEach((row) => {
      csv += `"${row.member.name}","${row.member.type === 'primary' ? 'اصلی' : 'فرعی'}",${row.attendedCount},${row.totalMealShare * multiplier},${row.totalPaidInMonth * multiplier},${row.overallNetBalance * multiplier}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lunch-report-${selectedYear}-${selectedMonth}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              گزارش‌های جامع مالی و عملکردی
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تحلیل هزینه‌ها، سهم هر نفر، خریدهای ماهانه و صورت‌حساب اعضا
            </p>
          </div>
        </div>

        {/* Month Selector & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-hidden cursor-pointer"
            >
              {PERSIAN_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1} className="dark:bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
            <span className="text-slate-400">/</span>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10) || selectedYear)}
              className="w-16 bg-transparent font-bold text-slate-800 dark:text-slate-200 px-1 py-1 text-center focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Selected Month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">تعداد وعده‌های ناهار ماه</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {toPersianDigits(monthMeals.length)} وعده
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            مجموع {toPersianDigits(totalAttendanceCount)} نفر-وعده
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">کل هزینه ناهارها</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalMealCost, currency)}
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-bold">
            میانگین هر ناهار: {formatCurrency(avgCostPerPerson, currency)} به ازای هر نفر
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">خریدهای کلی انبار ماه</span>
          <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(totalBulkPurchased, currency)}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {toPersianDigits(monthPurchases.length)} فاکتور خرید
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">مصرف مواد انبار در ماه</span>
          <h3 className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {formatCurrency(totalInventoryConsumedCost, currency)}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            خریدهای اضافه: {formatCurrency(totalExtraPurchasedCost, currency)}
          </span>
        </div>
      </div>

      {/* Monthly Attendance & Member Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            صورت‌حساب و حضور اعضا در {PERSIAN_MONTHS[selectedMonth - 1]} {toPersianDigits(selectedYear)}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3 px-4">عضو</th>
                <th className="py-3 px-4">نوع</th>
                <th className="py-3 px-4">تعداد روز حضور</th>
                <th className="py-3 px-4">مجموع سهم ناهار در ماه ({currency})</th>
                <th className="py-3 px-4">مجموع پرداختی‌های ماه ({currency})</th>
                <th className="py-3 px-4 text-left">مانده کل حساب فعلی ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {memberMonthlyStats.map((row) => {
                const isCreditor = row.overallNetBalance > 0;
                const isDebtor = row.overallNetBalance < 0;

                return (
                  <tr
                    key={row.member.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {row.member.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {row.member.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی'}
                    </td>
                    <td className="py-3 px-4 font-bold whitespace-nowrap">
                      {toPersianDigits(row.attendedCount)} روز
                    </td>
                    <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                      {formatCurrency(row.totalMealShare, currency)}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {formatCurrency(row.totalPaidInMonth, currency)}
                    </td>
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      <span
                        className={`font-black ${
                          isCreditor
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isDebtor
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCreditor && '+'}
                        {formatCurrency(row.overallNetBalance, currency)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Meals Breakdown in this Month */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            لیست ناهارهای ثبت‌شده در این ماه ({toPersianDigits(monthMeals.length)} ناهار)
          </h3>
        </div>

        {monthMeals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            در این ماه هیچ وعده ناهاری ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold">
                  <th className="py-3 px-4">تاریخ</th>
                  <th className="py-3 px-4">عنوان غذا</th>
                  <th className="py-3 px-4">تعداد حاضرین</th>
                  <th className="py-3 px-4">هزینه مواد انبار ({currency})</th>
                  <th className="py-3 px-4">خریدهای اضافه ({currency})</th>
                  <th className="py-3 px-4">هزینه کل ({currency})</th>
                  <th className="py-3 px-4 text-left">سهم هر نفر ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {monthMeals.map((meal) => (
                  <tr
                    key={meal.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {toPersianDigits(meal.dateJalali)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {meal.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {toPersianDigits(meal.participantIds.length)} نفر
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatCurrency(meal.totalInventoryCost, currency)}
                    </td>
                    <td className="py-3 px-4 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatCurrency(meal.totalExtraCost, currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(meal.totalCost, currency)}
                    </td>
                    <td className="py-3 px-4 text-left font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(meal.costPerParticipant, currency)}
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
