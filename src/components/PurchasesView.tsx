import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';
import {
  Purchase,
  Member,
  Ingredient,
  UnitType,
  PurchaseSplitMethod,
  MemberPurchaseShare,
  PurchaseMemberShare
} from '../types';
import {
  toPersianDigits,
  formatCurrency,
  toBaseAmount,
  fromBaseAmount,
  getTodayJalali,
  jalaliToIso,
  UNIT_LABELS
} from '../utils/jalali';
import { PurchaseSplitCalculator } from '../engine/PurchaseSplitCalculator';
import { InventoryCostCalculator } from '../engine/InventoryCostCalculator';

interface PurchasesViewProps {
  purchases: Purchase[];
  ingredients: Ingredient[];
  members: Member[];
  onSavePurchase: (
    purchase: Purchase,
    updatedIngredient: Ingredient
  ) => void;
  onDeletePurchase: (purchaseId: string) => void;
  preselectedIngredientId?: string | null;
  currency?: string;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  ingredients,
  members,
  onSavePurchase,
  onDeletePurchase,
  preselectedIngredientId,
  currency = 'تومان'
}) => {
  const today = getTodayJalali();
  const [isFormOpen, setIsFormOpen] = useState(!!preselectedIngredientId);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  // Form states
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(
    preselectedIngredientId || (ingredients[0]?.id || '')
  );
  const [dateJalali, setDateJalali] = useState<string>(today.formatted);
  const [quantity, setQuantity] = useState<string>('5');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [buyerMemberId, setBuyerMemberId] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<PurchaseSplitMethod>('equal');
  const [manualShares, setManualShares] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const activePrimaryMembers = useMemo(
    () => members.filter((m) => m.isActive && m.type === 'primary'),
    [members]
  );

  const selectedIngredient = useMemo(
    () => ingredients.find((i) => i.id === selectedIngredientId),
    [ingredients, selectedIngredientId]
  );

  // Computed shares
  const numericTotalPrice = parseInt(totalPrice.replace(/[^0-9]/g, ''), 10) || 0;
  const numericQuantity = parseFloat(quantity) || 0;

  const calculatedSplit = useMemo(() => {
    if (splitMethod === 'equal') {
      return PurchaseSplitCalculator.splitEqually(
        numericTotalPrice,
        activePrimaryMembers
      );
    } else {
      const shares: PurchaseMemberShare[] = activePrimaryMembers.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        amount: manualShares[m.id] !== undefined ? manualShares[m.id] : 0
      }));
      return PurchaseSplitCalculator.validateManualSplit(
        shares,
        numericTotalPrice
      );
    }
  }, [splitMethod, numericTotalPrice, activePrimaryMembers, manualShares]);

  // Projected new average cost
  const projectedAvgCost = useMemo(() => {
    if (!selectedIngredient || numericQuantity <= 0 || numericTotalPrice <= 0) {
      return selectedIngredient?.averageUnitCost || 0;
    }
    const baseTotalPrice = toBaseAmount(numericTotalPrice, currency);
    return InventoryCostCalculator.calculateNewAverageCost(
      selectedIngredient.currentStock,
      selectedIngredient.averageUnitCost,
      numericQuantity,
      baseTotalPrice
    );
  }, [selectedIngredient, numericQuantity, numericTotalPrice, currency]);

  // Form submission
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedIngredient) {
      setFormError('لطفاً یک ماده اولیه را انتخاب کنید.');
      return;
    }

    if (numericQuantity <= 0) {
      setFormError('مقدار خرید باید بزرگتر از صفر باشد.');
      return;
    }

    if (numericTotalPrice <= 0) {
      setFormError('مبلغ کل خرید باید معتبر و بزرگتر از صفر باشد.');
      return;
    }

    if (!buyerMemberId) {
      setFormError('لطفاً خریدار و پرداخت‌کننده را مشخص کنید.');
      return;
    }

    if (!calculatedSplit.isValid) {
      setFormError(calculatedSplit.errorMessage || 'مبالغ تسهیم معتبر نمی‌باشد.');
      return;
    }

    const buyer = members.find((m) => m.id === buyerMemberId);
    const baseTotalPrice = toBaseAmount(numericTotalPrice, currency);
    const baseShares = calculatedSplit.shares.map((s) => ({
      ...s,
      amount: toBaseAmount(s.amount, currency)
    }));

    const newPurchase: Purchase = {
      id: `purch-${Date.now()}`,
      dateJalali,
      dateIso: jalaliToIso(dateJalali),
      ingredientId: selectedIngredient.id,
      ingredientName: selectedIngredient.name,
      quantity: numericQuantity,
      displayQuantity: numericQuantity,
      displayUnit: selectedIngredient.displayUnit,
      unitCost: Math.round(baseTotalPrice / numericQuantity),
      totalCost: baseTotalPrice,
      unit: selectedIngredient.baseUnit,
      totalPrice: baseTotalPrice,
      unitPrice: Math.round(baseTotalPrice / numericQuantity),
      buyerMemberId,
      buyerMemberName: buyer ? buyer.name : 'نامشخص',
      splitMethod,
      shares: baseShares,
      memberShares: baseShares,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    // Calculate updated ingredient
    const updatedIngredient: Ingredient = {
      ...selectedIngredient,
      currentStock: selectedIngredient.currentStock + numericQuantity,
      averageUnitCost: projectedAvgCost,
      updatedAt: new Date().toISOString()
    };

    onSavePurchase(newPurchase, updatedIngredient);
    setIsFormOpen(false);
    setTotalPrice('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              ثبت خریدهای کلی و شارژ انبار
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              افزایش موجودی، محاسبه میانگین موزون قیمت و تسهیم بین اعضای اصلی
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isFormOpen ? 'بستن فرم' : 'ثبت فاکتور خرید جدید'}</span>
        </button>
      </div>

      {/* Collapsible Purchase Registration Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>اطلاعات خرید و تسهیم هزینه</span>
          </h3>

          <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ingredient select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کالای خریداری‌شده *
                </label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (موجودی فعلی: {toPersianDigits(ing.currentStock)} {ing.baseUnit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ شمسی خرید *
                </label>
                <input
                  type="text"
                  value={dateJalali}
                  onChange={(e) => setDateJalali(e.target.value)}
                  placeholder="1405/07/05"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Buyer member */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  خریدار و پرداخت‌کننده *
                </label>
                <select
                  value={buyerMemberId}
                  onChange={(e) => setBuyerMemberId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- انتخاب شخص پرداخت‌کننده --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type === 'primary' ? 'عضو اصلی' : 'عضو فرعی'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quantity */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مقدار خریداری‌شده ({selectedIngredient?.baseUnit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Total Price */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ کل فاکتور ({currency}) *
                </label>
                <input
                  type="number"
                  min="1000"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder={`مثلاً: ${currency === 'ریال' ? '25000000' : '2500000'}`}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Calculated unit price info */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400">قیمت میانگین جدید واحد</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                  {formatCurrency(projectedAvgCost, currency)} به ازای هر {selectedIngredient?.baseUnit}
                </span>
              </div>
            </div>

            {/* Split Method between active primary members */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  نحوه تسهیم خرید بین اعضای اصلی ({toPersianDigits(activePrimaryMembers.length)} نفر):
                </span>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSplitMethod('equal')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      splitMethod === 'equal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    تقسیم مساوی
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMethod('manual')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      splitMethod === 'manual'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    تسهیم دستی
                  </button>
                </div>
              </div>

              {/* Split Shares Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {activePrimaryMembers.map((m) => {
                  const currentShare =
                    calculatedSplit.shares.find((s) => s.memberId === m.id)?.amount || 0;

                  return (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                        {m.name}
                      </span>
                      {splitMethod === 'equal' ? (
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                          {formatCurrency(currentShare, currency, true)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          value={manualShares[m.id] !== undefined ? manualShares[m.id] : currentShare}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setManualShares((prev) => ({ ...prev, [m.id]: val }));
                          }}
                          className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-center font-bold text-xs"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {splitMethod === 'manual' && (
                <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1">
                  <span>مجموع سهم‌ها: {formatCurrency(calculatedSplit.shares.reduce((s, x) => s + x.amount, 0), currency, true)}</span>
                  <span>مبلغ فاکتور: {formatCurrency(numericTotalPrice, currency, true)}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات و شماره فاکتور (اختیاری)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: فاکتور شماره ۱۲۴ فروشگاه امید"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت نهایی خرید و ورود به انبار</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Purchases History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            تاریخچه خریدهای انبار ({toPersianDigits(purchases.length)} خرید ثبت‌شده)
          </h3>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            هنوز فاکتور خریدی برای انبار ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-4">تاریخ شمسی</th>
                  <th className="py-3 px-4">کالا</th>
                  <th className="py-3 px-4">مقدار</th>
                  <th className="py-3 px-4">مبلغ کل فاکتور ({currency})</th>
                  <th className="py-3 px-4">خریدار / پرداخت‌کننده</th>
                  <th className="py-3 px-4">تسهیم بین اعضا</th>
                  <th className="py-3 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {purchases.map((purch) => {
                  const isExpanded = expandedPurchaseId === purch.id;

                  return (
                    <React.Fragment key={purch.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {toPersianDigits(purch.dateJalali)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {purch.ingredientName}
                        </td>
                        <td className="py-3 px-4 font-semibold whitespace-nowrap">
                          {toPersianDigits(purch.quantity)} {purch.unit}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {formatCurrency(purch.totalPrice, currency)}
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {purch.buyerMemberName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPurchaseId(isExpanded ? null : purch.id)
                            }
                            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium cursor-pointer"
                          >
                            <span>
                              {purch.splitMethod === 'equal' ? 'مساوی' : 'دستی'} ({toPersianDigits((purch.shares || purch.memberShares || []).length)} نفر)
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-left whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `آیا از حذف این فاکتور خرید (${purch.ingredientName}) مطمئن هستید؟ موجودی انبار و تراکنش‌های حساب کسر خواهد شد.`
                                )
                              ) {
                                onDeletePurchase(purch.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف خرید"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-Row showing Member Shares */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-850/50">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="space-y-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                                تفکیک سهم هر یک از اعضای اصلی در این خرید:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {(purch.shares || purch.memberShares || []).map((share: MemberPurchaseShare) => (
                                  <div
                                    key={share.memberId}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-[11px]"
                                  >
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                      {share.memberName}:{' '}
                                    </span>
                                    <strong className="text-indigo-600 dark:text-indigo-400">
                                      {formatCurrency(share.amount, currency)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
