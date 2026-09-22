import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  X,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  CreditCard,
  Building,
  Check,
  Download,
  Info
} from 'lucide-react';
import {
  Member,
  MemberFinancialSummary,
  LedgerTransaction,
  Meal,
  Settlement
} from '../types';
import {
  toPersianDigits,
  formatCurrency,
  toBaseAmount,
  fromBaseAmount,
  getTodayJalali,
  jalaliToIso,
  numberToPersianWords
} from '../utils/jalali';

interface DebtInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  members: Member[];
  memberSummaries: MemberFinancialSummary[];
  transactions: LedgerTransaction[];
  meals: Meal[];
  currency: string;
  onSaveSettlement: (settlement: Settlement) => void;
}

export const DebtInvoiceModal: React.FC<DebtInvoiceModalProps> = ({
  isOpen,
  onClose,
  memberId,
  members,
  memberSummaries,
  transactions,
  meals,
  currency,
  onSaveSettlement
}) => {
  const today = getTodayJalali();
  const printRef = useRef<HTMLDivElement>(null);

  // Settlement Form State
  const [activeTab, setActiveTab] = useState<'invoice' | 'settle_direct' | 'settle_transfer'>('invoice');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [settleDate, setSettleDate] = useState<string>(today.formatted);
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === memberId);
  const currentSummary = memberSummaries.find((s) => s.member.id === memberId);
  const otherMembers = members.filter((m) => m.id !== memberId && m.isActive);

  if (!currentMember || !currentSummary) return null;

  const netBalance = currentSummary.netBalance;
  const isDebtor = netBalance < 0;
  const totalDebtAmount = isDebtor ? Math.abs(netBalance) : 0;

  // Filter itemized debits for this member (meal shares & transferred debts)
  const debitTransactions = transactions
    .filter(
      (t) =>
        t.memberId === memberId &&
        (t.type === 'meal_share' || t.type === 'debt_transfer_in' || (!t.isCredit && t.direction === 'debit'))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Filter credits / payments made by this member
  const creditTransactions = transactions
    .filter(
      (t) =>
        t.memberId === memberId &&
        (t.isCredit ||
          t.type === 'inventory_purchase_share' ||
          t.type === 'extra_purchase_buyer' ||
          t.type === 'settlement_receipt' ||
          t.type === 'debt_transfer_out')
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const factorNumber = `FAC-${currentMember.id.replace('mem-', '').padStart(3, '0')}-${today.jy}${String(today.jm).padStart(2, '0')}${String(today.jd).padStart(2, '0')}`;

  // Handle direct payment submission
  const handleDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numAmount = parseInt(paymentAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (numAmount <= 0) {
      setErrorMessage('مبلغ پرداختی باید بیشتر از صفر باشد.');
      return;
    }

    const baseAmount = toBaseAmount(numAmount, currency);

    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      memberId: currentMember.id,
      memberName: currentMember.name,
      type: 'receipt',
      amount: baseAmount,
      dateJalali: settleDate,
      dateIso: jalaliToIso(settleDate),
      notes: settleNotes.trim() || `تسویه نقدی سهم بدهی ناهار توسط ${currentMember.name}`,
      createdAt: new Date().toISOString()
    };

    onSaveSettlement(newSettlement);
    setSuccessMessage(`پرداخت مبلغ ${formatCurrency(baseAmount, currency)} با موفقیت ثبت و از بدهی کسر شد.`);
    setActiveTab('invoice');
    setPaymentAmount('');
    setSettleNotes('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Handle debt transfer submission
  const handleDebtTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!targetMemberId) {
      setErrorMessage('لطفاً عضو مقصد جهت انتقال بدهی را انتخاب کنید.');
      return;
    }

    const targetMember = members.find((m) => m.id === targetMemberId);
    if (!targetMember) {
      setErrorMessage('عضو مقصد یافت نشد.');
      return;
    }

    const numAmount = parseInt(transferAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (numAmount <= 0) {
      setErrorMessage('مبلغ انتقال باید بیشتر از صفر باشد.');
      return;
    }

    const baseAmount = toBaseAmount(numAmount, currency);

    const newSettlement: Settlement = {
      id: `set-trans-${Date.now()}`,
      memberId: currentMember.id,
      memberName: currentMember.name,
      targetMemberId: targetMember.id,
      targetMemberName: targetMember.name,
      type: 'transfer_debt',
      amount: baseAmount,
      dateJalali: settleDate,
      dateIso: jalaliToIso(settleDate),
      notes:
        settleNotes.trim() ||
        `انتقال بدهی از حساب ${currentMember.name} به حساب ${targetMember.name}`,
      createdAt: new Date().toISOString()
    };

    onSaveSettlement(newSettlement);
    setSuccessMessage(
      `مبلغ ${formatCurrency(baseAmount, currency)} از بدهی ${currentMember.name} کسر و به حساب ${targetMember.name} انتقال یافت.`
    );
    setActiveTab('invoice');
    setTransferAmount('');
    setTargetMemberId('');
    setSettleNotes('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  فاکتور و صورت‌حساب بدهی ناهار
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isDebtor
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {isDebtor ? `بدهکار: ${formatCurrency(totalDebtAmount, currency)}` : 'تسویه کامل'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                طرف حساب: <strong className="text-slate-700 dark:text-slate-200">{currentMember.name}</strong> ({currentMember.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="چاپ یا ذخیره فایل PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">چاپ / خروجی PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Hidden in Print) */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 gap-2 text-xs font-bold print:hidden">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'invoice'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مشاهده فاکتور و ریز بدهی‌ها</span>
          </button>

          {isDebtor && (
            <>
              <button
                onClick={() => {
                  setActiveTab('settle_direct');
                  setPaymentAmount(totalDebtAmount.toString());
                }}
                className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'settle_direct'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>روش ۱: پرداخت مستقیم به صندوق</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settle_transfer');
                  setTransferAmount(totalDebtAmount.toString());
                }}
                className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'settle_transfer'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>روش ۲: انتقال بدهی به حساب دیگری</span>
              </button>
            </>
          )}
        </div>

        {/* Success or Error Notice */}
        {successMessage && (
          <div className="m-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold print:hidden">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold print:hidden">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: FORMAL INVOICE FACTOR (PRINTABLE) */}
          {activeTab === 'invoice' && (
            <div
              ref={printRef}
              className="bg-white dark:bg-slate-900 rounded-2xl print:border-none print:shadow-none print:p-0 print:m-0 space-y-6 text-slate-800 dark:text-slate-100"
            >
              {/* Factor Header */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                      ف
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        صورت‌حساب و فاکتور تسویه حساب بدهی ناهار
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        سامانه مدیریت و حسابداری هزینه‌های اداری و انبار
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-left text-xs space-y-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-slate-500">شماره فاکتور:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {factorNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-slate-500">تاریخ صدور:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {today.readableFa}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-slate-500">وضعیت حساب:</span>
                      <span
                        className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                          isDebtor
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}
                      >
                        {isDebtor ? 'تسویه نشده (بدهکار)' : 'تسویه شده'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Member / Debtor Profile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">نام و نام خانوادگی:</span>
                    <strong className="text-slate-900 dark:text-white text-sm">
                      {currentMember.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">نوع عضویت:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentMember.type === 'primary' ? 'عضو اصلی شریک انبار' : 'عضو فرعی / مهمان'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">تعداد وعده‌های حاضر:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(currentSummary.attendedMealsCount)} وعده
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">شماره تماس:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentMember.phone ? toPersianDigits(currentMember.phone) : 'ثبت نشده'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Debts Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>ریز اقلام و سهم وعده‌های ناهار بدهکار</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({toPersianDigits(debitTransactions.length)} مورد)
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    واحد مبالغ: {currency}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">ردیف</th>
                          <th className="py-2.5 px-3">تاریخ</th>
                          <th className="py-2.5 px-3">شرح بدهی و رویداد</th>
                          <th className="py-2.5 px-3 text-center">نوع</th>
                          <th className="py-2.5 px-3 text-left">مبلغ ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {debitTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              هیچ سهم ناهار یا بدهکاری ثبت‌شده‌ای برای این شخص وجود ندارد.
                            </td>
                          </tr>
                        ) : (
                          debitTransactions.map((tx, idx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                                {toPersianDigits(idx + 1)}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                                {toPersianDigits(tx.dateJalali)}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {tx.notes || tx.description || 'سهم وعده ناهار'}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {tx.type === 'debt_transfer_in' ? 'انتقال بدهی از دیگری' : 'سهم ناهار'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-left font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                {formatCurrency(tx.amount, currency)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Summary and Net Payable Calculation Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Offsetting Credits box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span>خلاصه پرداختی‌ها و اعتبارات قبلی:</span>
                    <span>{formatCurrency(currentSummary.totalCredits, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>سهم پرداختی خرید انبار:</span>
                    <span>{formatCurrency(currentSummary.totalInventoryPaid, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>پرداخت خریدهای اضافه:</span>
                    <span>{formatCurrency(currentSummary.totalExtraPaid, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>تسویه‌ها و واریزی‌های قبلی:</span>
                    <span>{formatCurrency(currentSummary.totalSettledReceipts, currency)}</span>
                  </div>
                </div>

                {/* Final Net Debt Statement */}
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-3 flex flex-col justify-between ${
                    isDebtor
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      {isDebtor ? 'مانده خالص بدهی قابل پرداخت:' : 'وضعیت نهایی حساب:'}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span
                        className={`text-2xl sm:text-3xl font-black ${
                          isDebtor ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(totalDebtAmount, currency)}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {isDebtor ? 'بدهکار به صندوق' : 'تسویه کامل'}
                      </span>
                    </div>
                  </div>

                  {isDebtor && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/60 text-[11px]">
                      <span className="text-slate-500 font-bold block mb-0.5">مبلغ به حروف:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {numberToPersianWords(currency === 'ریال' ? totalDebtAmount * 10 : totalDebtAmount)} {currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Official Signatures Section (Visible in factor & print) */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-12">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    امضای مسئول امور مالی / مدیر ناهار
                  </span>
                  <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-36"></div>
                </div>

                <div className="space-y-12">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    امضای عضو بدهکار ({currentMember.name})
                  </span>
                  <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-36"></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT PAYMENT SETTLEMENT */}
          {activeTab === 'settle_direct' && isDebtor && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-5 h-5" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  روش اول: ثبت پرداخت مستقیم به صندوق
                </h4>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                در این روش، وجه بدهی به صورت نقدی، کارت‌به‌کارت یا واریز مستقیم به صندوق ناهار تسویه می‌شود و مانده بدهی {currentMember.name} کاهش می‌یابد.
              </p>

              <form onSubmit={handleDirectPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ تسویه ({currency}) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={paymentAmount ? toPersianDigits(parseInt(paymentAmount, 10).toLocaleString('en-US')) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setPaymentAmount(raw);
                      }}
                      required
                      placeholder={`مثلاً ${toPersianDigits(fromBaseAmount(totalDebtAmount, currency))}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(fromBaseAmount(totalDebtAmount, currency).toString())}
                      className="absolute left-2.5 top-2 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
                    >
                      تسویه کامل کل بدهی
                    </button>
                  </div>
                  {paymentAmount && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      به حروف: {numberToPersianWords(parseInt(paymentAmount, 10))} {currency}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ واریز / وصول *
                  </label>
                  <input
                    type="text"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    توضیحات و شماره پیگیری
                  </label>
                  <textarea
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    rows={2}
                    placeholder="مثلاً: پرداخت نقدی / واریز به حساب صندوق با شماره پیگیری ۱۲۳۴۵۶"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('invoice')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
                  >
                    تأیید و ثبت پرداخت مستقیم
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: TRANSFER DEBT TO ANOTHER MEMBER */}
          {activeTab === 'settle_transfer' && isDebtor && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-amber-600 dark:text-amber-400">
                <ArrowRightLeft className="w-5 h-5" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  روش دوم: انتقال بدهی به حساب شخص دیگر
                </h4>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4" />
                  <span>نحوه عملکرد انتقال بدهی:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  با ثبت این فرم، بدهی انتخابی از حساب <strong>{currentMember.name}</strong> کسر می‌شود (تسویه می‌گردد) و عیناً به حساب عضو مقصد اضافه خواهد شد تا در محاسبات بعدی از او دریافت شود.
                </p>
              </div>

              <form onSubmit={handleDebtTransfer} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    انتقال به حساب کدام عضو؟ *
                  </label>
                  <select
                    value={targetMemberId}
                    onChange={(e) => setTargetMemberId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="">-- لطفاً یک عضو را انتخاب نمایید --</option>
                    {otherMembers.map((m) => {
                      const sum = memberSummaries.find((s) => s.member.id === m.id);
                      const bal = sum ? sum.netBalance : 0;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} ({bal > 0 ? `طلبکار: +${formatCurrency(bal, currency)}` : bal < 0 ? `بدهکار: ${formatCurrency(bal, currency)}` : 'بی‌حساب'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ قابل انتقال ({currency}) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={transferAmount ? toPersianDigits(parseInt(transferAmount, 10).toLocaleString('en-US')) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setTransferAmount(raw);
                      }}
                      required
                      placeholder={`مثلاً ${toPersianDigits(fromBaseAmount(totalDebtAmount, currency))}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setTransferAmount(fromBaseAmount(totalDebtAmount, currency).toString())}
                      className="absolute left-2.5 top-2 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer"
                    >
                      کل مانده بدهی
                    </button>
                  </div>
                  {transferAmount && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      به حروف: {numberToPersianWords(parseInt(transferAmount, 10))} {currency}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ انتقال *
                  </label>
                  <input
                    type="text"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شرح و علت انتقال
                  </label>
                  <textarea
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    rows={2}
                    placeholder="مثلاً: انتقال بدهی ناهار این هفته با هماهنگی طرفین"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('invoice')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/30 cursor-pointer active:scale-95"
                  >
                    تأیید و انتقال بدهی
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs print:hidden">
          <div className="text-slate-500">
            برای صدور یا دانلود فایل PDF فاکتور، از دکمه <strong className="text-slate-800 dark:text-slate-200">چاپ / خروجی PDF</strong> استفاده کنید.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
