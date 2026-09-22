import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  ShoppingBag,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Ingredient, UnitType } from '../types';
import {
  toPersianDigits,
  formatCurrency,
  toBaseAmount,
  fromBaseAmount,
  UNIT_LABELS
} from '../utils/jalali';

interface InventoryViewProps {
  ingredients: Ingredient[];
  onSaveIngredient: (ingredient: Ingredient) => void;
  onDeleteIngredient: (id: string) => void;
  onNavigateToPurchaseForIngredient: (ingredientId: string) => void;
  currency?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  ingredients,
  onSaveIngredient,
  onDeleteIngredient,
  onNavigateToPurchaseForIngredient,
  currency = 'تومان'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'low_stock' | 'highest_value' | 'name'>('low_stock');
  const [modalIngredient, setModalIngredient] = useState<Ingredient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for add/edit ingredient
  const [formName, setFormName] = useState('');
  const [formBaseUnit, setFormBaseUnit] = useState<UnitType>('kg');
  const [formCurrentStock, setFormCurrentStock] = useState('0');
  const [formMinThreshold, setFormMinThreshold] = useState('2');
  const [formInitialCost, setFormInitialCost] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  const openAddModal = () => {
    setModalIngredient(null);
    setFormName('');
    setFormBaseUnit('kg');
    setFormCurrentStock('0');
    setFormMinThreshold('2');
    setFormInitialCost('0');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (ing: Ingredient) => {
    setModalIngredient(ing);
    setFormName(ing.name);
    setFormBaseUnit(ing.baseUnit);
    setFormCurrentStock(ing.currentStock.toString());
    setFormMinThreshold(ing.minThresholdStock.toString());
    setFormInitialCost(fromBaseAmount(ing.averageUnitCost, currency).toString());
    setFormNotes(ing.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('لطفاً نام ماده اولیه را وارد کنید.');
      return;
    }

    const currentStock = parseFloat(formCurrentStock) || 0;
    const minThreshold = parseFloat(formMinThreshold) || 0;
    const rawCost = parseInt(formInitialCost.replace(/[^0-9]/g, ''), 10) || 0;
    const avgCost = toBaseAmount(rawCost, currency);

    const ingToSave: Ingredient = {
      id: modalIngredient ? modalIngredient.id : `ing-${Date.now()}`,
      name: formName.trim(),
      baseUnit: formBaseUnit,
      displayUnit: modalIngredient?.displayUnit || (formBaseUnit === 'g' ? 'kg' : formBaseUnit === 'ml' ? 'l' : formBaseUnit),
      currentStock,
      minThresholdStock: minThreshold,
      totalPurchased: modalIngredient?.totalPurchased || currentStock,
      totalConsumed: modalIngredient?.totalConsumed || 0,
      averageUnitCost: avgCost,
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    onSaveIngredient(ingToSave);
    setIsModalOpen(false);
  };

  // Filter & Sort
  const filteredIngredients = ingredients
    .filter((ing) => ing.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'low_stock') {
        const aShortage = a.currentStock - a.minThresholdStock;
        const bShortage = b.currentStock - b.minThresholdStock;
        return aShortage - bShortage;
      }
      if (sortBy === 'highest_value') {
        const aVal = a.currentStock * a.averageUnitCost;
        const bVal = b.currentStock * b.averageUnitCost;
        return bVal - aVal;
      }
      return a.name.localeCompare(b.name, 'fa');
    });

  const totalInventoryValuation = ingredients.reduce(
    (sum, i) => sum + (i.currentStock > 0 ? i.currentStock * i.averageUnitCost : 0),
    0
  );

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minThresholdStock).length;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              مدیریت و انبارداری مواد غذایی
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ارزش کل موجودی: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalInventoryValuation, currency)}</strong> ({toPersianDigits(ingredients.length)} قلم)
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-teal-600/30 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف ماده اولیه جدید</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجوی نام ماده اولیه..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">مرتب‌سازی:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
          >
            <option value="low_stock">کمترین موجودی (هشدار کسری)</option>
            <option value="highest_value">بیشترین ارزش ریالی انبار</option>
            <option value="name">حروف الفبا</option>
          </select>
        </div>
      </div>

      {/* Ingredients Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3 px-4">نام کالا</th>
                <th className="py-3 px-4">موجودی فعلی</th>
                <th className="py-3 px-4">حداقل هشدار</th>
                <th className="py-3 px-4">میانگین موزون قیمت واحد ({currency})</th>
                <th className="py-3 px-4">ارزش کل موجودی ({currency})</th>
                <th className="py-3 px-4">وضعیت</th>
                <th className="py-3 px-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredIngredients.map((ing) => {
                const isLow = ing.currentStock <= ing.minThresholdStock;
                const valuation = ing.currentStock > 0 ? ing.currentStock * ing.averageUnitCost : 0;

                return (
                  <tr
                    key={ing.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isLow ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {ing.name}
                      {ing.notes && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {ing.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                      {toPersianDigits(ing.currentStock)} {UNIT_LABELS[ing.baseUnit] || ing.baseUnit}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {toPersianDigits(ing.minThresholdStock)} {UNIT_LABELS[ing.baseUnit] || ing.baseUnit}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatCurrency(ing.averageUnitCost, currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                      {formatCurrency(valuation, currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>کسری / موجودی کم</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>کافی</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onNavigateToPurchaseForIngredient(ing.id)}
                          className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-100 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                          title="ثبت خرید این قلم کالا"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">ثبت خرید</span>
                        </button>

                        <button
                          onClick={() => openEditModal(ing)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="ویرایش مشخصات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`آیا از حذف ماده اولیه "${ing.name}" مطمئن هستید؟`)) {
                              onDeleteIngredient(ing.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Ingredient */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {modalIngredient ? 'ویرایش ماده اولیه' : 'تعریف ماده اولیه جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام ماده اولیه *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: برنج هاشمی، روغن، پیاز..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    واحد شمارش پایه
                  </label>
                  <select
                    value={formBaseUnit}
                    onChange={(e) => setFormBaseUnit(e.target.value as UnitType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="kg">کیلوگرم (kg)</option>
                    <option value="g">گرم (g)</option>
                    <option value="liter">لیتر (L)</option>
                    <option value="ml">میلی‌لیتر (ml)</option>
                    <option value="piece">عدد / دانه</option>
                    <option value="pack">بسته</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل آستانه هشدار موجودی
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    موجودی اولیه در انبار
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت واحد پایه ({currency})
                  </label>
                  <input
                    type="number"
                    value={formInitialCost}
                    onChange={(e) => setFormInitialCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و یادداشت
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="محل نگهداری، مشخصات برند و..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  ذخیره ماده اولیه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
