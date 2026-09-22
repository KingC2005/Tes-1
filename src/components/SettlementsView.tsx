import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Trash2,
  Calendar,
  CheckCircle2,
  Wallet,
  AlertCircle,
  FileText
} from 'lucide-react';
import {
  Settlement,
  Member,
  MemberFinancialSummary,
  LedgerTransaction,
  Meal
} from '../types';
import {
  toPersianDigits,
  formatCurrency,
  toBaseAmount,
  fromBaseAmount,
  getTodayJalali,
  jalaliToIso
} from '../utils/jalali';
import { DebtInvoiceModal } from './DebtInvoiceModal';

interface SettlementsViewProps {
  settlements: Settlement[];
  members: Member[];
  memberSummaries: MemberFinancialSummary[];
  transactions?: LedgerTransaction[];
  meals?: Meal[];
  currency?: string;
  onSaveSettlement: (settlement: Settlement) => void;
  onDeleteSettlement: (settlementId: string) => void;
  preselectedMemberId?: string | null;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({
  settlements,
  members,
  memberSummaries,
  transactions = [],
  meals = [],
  currency = 'تومان',
  onSaveSettlement,
  onDeleteSettlement,
  preselectedMemberId
}) => {
  const today = getTodayJalali();
  const [isFormOpen, setIsFormOpen] = useState(!!preselectedMemberId);
  const [invoiceMemberId, setInvoiceMemberId] = useState<string | null>(null);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    preselectedMemberId || (members[0]?.id || '')
  );
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [settlementType, setSettlementType] = useState<'receipt' | 'payout' | 'transfer_debt'>('receipt');
  const [amount, setAmount] = useState<string>('');
  const [dateJalali, setDateJalali] = useState<string>(today.formatted);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const currentMember = members.find((m) => m.id === selectedMemberId);
  const currentSummary = memberSummaries.find((s) => s.member.id === selectedMemberId);
  const currentBalance = currentSummary ? currentSummary.netBalance : 0;
  const otherMembers = members.filter((m) => m.id !== selectedMemberId);

  // Auto configure type based on member balance
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const sum = memberSummaries.find((s) => s.member.id === memberId);
    if (sum) {
      if (sum.netBalance > 0) {
        setSettlementType('payout');
      } else {
        setSettlementType('receipt');
      }
    }
  };

  const handleSetFullSettlement = () => {
    if (currentBalance !== 0) {
      setAmount(fromBaseAmount(Math.abs(currentBalance), currency).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
    if (!selectedMemberId) {
      setErrorMsg('لطفاً یک عضو را انتخاب نمایید.');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg('مبلغ تسویه باید بزرگتر از صفر باشد.');
      return;
    }

    if (settlementType === 'transfer_debt') {
      if (!targetMemberId) {
        setErrorMsg('لطفاً عضو مقصد جهت انتقال بدهی را مشخص کنید.');
        return;
      }
    }

    const member = members.find((m) => m.id === selectedMemberId);
    const targetMember = members.find((m) => m.id === targetMemberId);

    const baseAmount = toBaseAmount(numericAmount, currency);

    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      memberId: selectedMemberId,
      memberName: member ? member.name : 'نامشخص',
      targetMemberId: settlementType === 'transfer_debt' ? targetMemberId : undefined,
      targetMemberName: settlementType === 'transfer_debt' && targetMember ? targetMember.name : undefined,
      amount: baseAmount,
      type: settlementType,
      dateJalali,
      dateIso: jalaliToIso(dateJalali),
      notes:
        notes.trim() ||
        (settlementType === 'transfer_debt'
          ? `انتقال بدهی از حساب ${member?.name} به ${targetMember?.name}`
          : ''),
      createdAt: new Date().toISOString()
    };

    onSaveSettlement(newSettlement);
    setIsFormOpen(false);
    setAmount('');
    setNotes('');
    setTargetMemberId('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              تسویه حساب‌های مالی
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ثبت واریز بدهی بدهکاران به صندوق و پرداخت طلب طلبکاران
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isFormOpen ? 'بستن فرم' : 'ثبت تسویه حساب جدید'}</span>
        </button>
      </div>

      {/* Settlement Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>مشخصات تسویه حساب</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Member select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب عضو طرف حساب *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  {members.map((m) => {
                    const sum = memberSummaries.find((s) => s.member.id === m.id);
                    const b = sum ? sum.netBalance : 0;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({b > 0 ? `طلبکار: +${formatCurrency(b, currency)}` : b < 0 ? `بدهکار: ${formatCurrency(b, currency)}` : 'تسویه'})
                      </option>
                    );
                  })}
                </select>

                {currentSummary && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">مانده فعلی عضو</span>
                      <span
                        className={`font-black ${
                          currentBalance > 0
                            ? 'text-emerald-600'
                            : currentBalance < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {currentBalance > 0 && '+'}
                        {formatCurrency(currentBalance, currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {currentBalance < 0 && (
                        <button
                          type="button"
                          onClick={() => setInvoiceMemberId(selectedMemberId)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>فاکتور بدهی (PDF)</span>
                        </button>
                      )}

                      {currentBalance !== 0 && (
                        <button
                          type="button"
                          onClick={handleSetFullSettlement}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] cursor-pointer"
                        >
                          تسویه کامل ({formatCurrency(Math.abs(currentBalance), currency)})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Type and Date */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    جهت و نوع تسویه *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettlementType('receipt')}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        settlementType === 'receipt'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <span>وصول بدهی</span>
                      <span className="block text-[8px] sm:text-[9px] font-normal text-slate-400">واریز به صندوق</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettlementType('payout')}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        settlementType === 'payout'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                      <span>پرداخت طلب</span>
                      <span className="block text-[8px] sm:text-[9px] font-normal text-slate-400">پرداخت به عضو</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettlementType('transfer_debt')}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        settlementType === 'transfer_debt'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <ArrowRightLeft className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                      <span>انتقال بدهی</span>
                      <span className="block text-[8px] sm:text-[9px] font-normal text-slate-400">به عضو دیگر</span>
                    </button>
                  </div>
                </div>

                {settlementType === 'transfer_debt' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                    <label className="block font-bold text-amber-900 dark:text-amber-200 mb-1">
                      انتقال بدهی به حساب کدام عضو؟ *
                    </label>
                    <select
                      value={targetMemberId}
                      onChange={(e) => setTargetMemberId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">-- عضو مقصد را انتخاب کنید --</option>
                      {otherMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      مبلغ تسویه ({currency}) *
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`مبلغ به ${currency}`}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تاریخ شمسی *
                    </label>
                    <input
                      type="text"
                      value={dateJalali}
                      onChange={(e) => setDateJalali(e.target.value)}
                      placeholder="1405/07/05"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات و شماره پیگیری بانکی
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: کارت به کارت، شماره پیگیری ۷۲۸۳۹۱"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت سند تسویه</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settlements Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            تاریخچه اسناد تسویه حساب ({toPersianDigits(settlements.length)} سند)
          </h3>
        </div>

        {settlements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            هنوز هیچ سند تسویه حسابی ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-4">تاریخ شمسی</th>
                  <th className="py-3 px-4">نام عضو</th>
                  <th className="py-3 px-4">نوع عملیات</th>
                  <th className="py-3 px-4">مبلغ تسویه ({currency})</th>
                  <th className="py-3 px-4">شرح و شماره پیگیری</th>
                  <th className="py-3 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {settlements.map((set) => (
                  <tr
                    key={set.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {toPersianDigits(set.dateJalali)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {set.memberName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          set.type === 'receipt'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : set.type === 'transfer_debt'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {set.type === 'receipt'
                          ? 'وصول بدهی از عضو'
                          : set.type === 'transfer_debt'
                          ? `انتقال بدهی به ${set.targetMemberName || 'عضو دیگر'}`
                          : 'پرداخت طلب به عضو'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black whitespace-nowrap text-slate-900 dark:text-white">
                      {formatCurrency(set.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {set.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInvoiceMemberId(set.memberId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="مشاهده فاکتور بدهی"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`آیا از ابطال و حذف سند تسویه "${set.memberName}" مطمئن هستید؟`)) {
                              onDeleteSettlement(set.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف سند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Debt Invoice Modal */}
      {invoiceMemberId && (
        <DebtInvoiceModal
          isOpen={!!invoiceMemberId}
          onClose={() => setInvoiceMemberId(null)}
          memberId={invoiceMemberId}
          members={members}
          memberSummaries={memberSummaries}
          transactions={transactions}
          meals={meals}
          currency={currency}
          onSaveSettlement={(settlement) => {
            onSaveSettlement(settlement);
          }}
        />
      )}
    </div>
  );
};
