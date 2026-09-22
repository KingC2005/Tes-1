import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Receipt,
  FileText,
  User,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Printer
} from 'lucide-react';
import {
  Member,
  LedgerTransaction,
  MemberFinancialSummary,
  TransactionType,
  Meal,
  Settlement
} from '../types';
import {
  toPersianDigits,
  formatCurrency
} from '../utils/jalali';
import { DebtInvoiceModal } from './DebtInvoiceModal';

interface AccountsViewProps {
  members: Member[];
  memberSummaries: MemberFinancialSummary[];
  transactions: LedgerTransaction[];
  meals?: Meal[];
  currency?: string;
  selectedMemberId?: string;
  onSelectMember: (memberId: string) => void;
  onOpenSettlementForMember: (memberId: string) => void;
  onSaveSettlement?: (settlement: Settlement) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  members,
  memberSummaries,
  transactions,
  meals = [],
  currency = 'تومان',
  selectedMemberId,
  onSelectMember,
  onOpenSettlementForMember,
  onSaveSettlement
}) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const activeId = selectedMemberId || members[0]?.id || '';
  const currentMember = members.find((m) => m.id === activeId);
  const currentSummary = memberSummaries.find((s) => s.member.id === activeId);

  // Filter transactions for this member sorted by date descending
  const memberTransactions = transactions
    .filter((t) => t.memberId === activeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const isCreditor = currentSummary ? currentSummary.netBalance > 0 : false;
  const isDebtor = currentSummary ? currentSummary.netBalance < 0 : false;

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'inventory_purchase_share':
        return { label: 'سهم خرید انبار', isPositive: true };
      case 'extra_purchase_buyer':
        return { label: 'پرداخت خرید اضافه وعده', isPositive: true };
      case 'meal_share':
        return { label: 'سهم ناهار مصرفی (دنگ)', isPositive: false };
      case 'settlement_receipt':
        return { label: 'وصول وجه تسویه حساب (بدهی)', isPositive: true };
      case 'settlement_payout':
        return { label: 'پرداخت وجه تسویه حساب (طلب)', isPositive: false };
      case 'debt_transfer_out':
        return { label: 'انتقال بدهی به حساب دیگر', isPositive: true };
      case 'debt_transfer_in':
        return { label: 'پذیرش بدهی منتقل‌شده از دیگری', isPositive: false };
      case 'direct_payment':
        return { label: 'پرداخت مستقیم به صندوق', isPositive: true };
      default:
        return { label: 'تراکنش مالی', isPositive: true };
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              دفتر کل و ریز محاسبات مالی اعضا
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مشاهده کاردکس مالی، تراکنش‌ها، مبالغ پرداختی و سهم هر عضو
            </p>
          </div>
        </div>

        {/* Member Dropdown Switcher */}
        <div className="w-full sm:w-64">
          <select
            value={activeId}
            onChange={(e) => onSelectMember(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentMember && currentSummary && (
        <>
          {/* Member Balance Overview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold ${
                    currentMember.type === 'primary'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  }`}
                >
                  {currentMember.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {currentMember.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentMember.type === 'primary'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                      }`}
                    >
                      {currentMember.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی / مهمان'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تعداد وعده‌های حاضر: <strong>{toPersianDigits(currentSummary.attendedMealsCount)} وعده</strong>
                  </p>
                </div>
              </div>

              {/* Net Balance Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end sm:self-auto">
                <div className="text-left sm:text-left">
                  <span className="text-[10px] text-slate-400 block">مانده خالص حساب</span>
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      isCreditor
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isDebtor
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCreditor && '+'}
                    {formatCurrency(currentSummary.netBalance, currency)}
                  </span>
                  <span className="block text-[11px] font-bold text-slate-500">
                    {isCreditor ? 'طلبکار از صندوق' : isDebtor ? 'بدهکار به صندوق' : 'کاملاً تسویه'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 shadow-xs"
                    title="مشاهده فاکتور تفکیک‌شده بدهی، انتقال بدهی یا چاپ PDF"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>فاکتور و رسید بدهی (PDF)</span>
                  </button>

                  <button
                    onClick={() => onOpenSettlementForMember(currentMember.id)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    ثبت تسویه حساب
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Financial Breakdown Boxes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>پرداخت خرید انبار</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {formatCurrency(currentSummary.totalInventoryPaid, currency)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>پرداخت خرید اضافه</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {formatCurrency(currentSummary.totalExtraPaid, currency)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
                  <span>سهم ناهارهای مصرفی</span>
                </div>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                  {formatCurrency(currentSummary.totalMealCostDebits, currency)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Receipt className="w-3.5 h-3.5 text-teal-600" />
                  <span>گردش تسویه‌ها</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {formatCurrency(currentSummary.totalSettledPayouts + currentSummary.totalSettledReceipts, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological Transaction History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  گردش حساب و تاریخچه تراکنش‌ها ({toPersianDigits(memberTransactions.length)} تراکنش)
                </h4>
              </div>
            </div>

            {memberTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                هیچ تراکنشی برای این عضو ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                      <th className="py-3 px-4">تاریخ شمسی</th>
                      <th className="py-3 px-4">نوع تراکنش</th>
                      <th className="py-3 px-4">شرح / توضیحات</th>
                      <th className="py-3 px-4">اثر مالی</th>
                      <th className="py-3 px-4 text-left">مبلغ ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {memberTransactions.map((tx) => {
                      const typeInfo = getTransactionTypeLabel(tx.type);
                      const isCredit = tx.isCredit || tx.direction === 'credit';

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {toPersianDigits(tx.dateJalali)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {typeInfo.label}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {tx.notes || tx.description || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCredit
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {isCredit ? 'بستانکار (طلب)' : 'بدهکار'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-left whitespace-nowrap">
                            <span
                              className={`font-extrabold ${
                                isCredit
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isCredit ? '+' : '-'}
                              {formatCurrency(tx.amount, currency)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Debt Invoice & PDF Receipt Modal */}
      {isInvoiceModalOpen && currentMember && currentSummary && (
        <DebtInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          memberId={currentMember.id}
          members={members}
          memberSummaries={memberSummaries}
          transactions={transactions}
          meals={meals}
          currency={currency}
          onSaveSettlement={(settlement) => {
            if (onSaveSettlement) {
              onSaveSettlement(settlement);
            }
          }}
        />
      )}
    </div>
  );
};
