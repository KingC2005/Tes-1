import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Utensils,
  Calendar,
  Users,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  Meal,
  Member,
  Ingredient,
  Recipe,
  UnitType,
  MeasurementMethod,
  ExtraPurchaseItem,
  MealIngredientItem
} from '../types';
import {
  toPersianDigits,
  formatCurrency,
  toBaseAmount,
  jalaliToIso,
  getTodayJalali,
  UNIT_LABELS
} from '../utils/jalali';
import { MealCostCalculator } from '../engine/MealCostCalculator';
import { InventoryTransactionManager } from '../engine/InventoryTransactionManager';

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Meal) => void;
  initialMeal?: Meal | null;
  defaultDate?: string;
  members: Member[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  allowNegativeInventory: boolean;
  currency?: string;
}

interface FormIngredientRow {
  ingredientId: string;
  ingredientName: string;
  unit: UnitType;
  measurementMethod: MeasurementMethod;
  perPersonAmount: number;
  percentageAmount: number;
  baseAmount: number;
}

export const MealFormModal: React.FC<MealFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMeal,
  defaultDate,
  members,
  ingredients,
  recipes,
  allowNegativeInventory,
  currency = 'تومان'
}) => {
  const today = getTodayJalali();

  // Form state
  const [dateJalali, setDateJalali] = useState<string>(defaultDate || today.formatted);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [ingredientRows, setIngredientRows] = useState<FormIngredientRow[]>([]);
  const [extraPurchases, setExtraPurchases] = useState<ExtraPurchaseItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // New extra purchase temporary form
  const [newExtraName, setNewExtraName] = useState<string>('');
  const [newExtraCost, setNewExtraCost] = useState<string>('');
  const [newExtraBuyer, setNewExtraBuyer] = useState<string>('');
  const [newExtraMode, setNewExtraMode] = useState<'direct_consumption' | 'add_to_inventory'>('direct_consumption');

  // Load initial data on open/edit
  useEffect(() => {
    if (initialMeal) {
      setDateJalali(initialMeal.dateJalali);
      setTitle(initialMeal.title);
      setNotes(initialMeal.notes || '');
      setSelectedRecipeId(initialMeal.recipeId || '');
      setSelectedParticipantIds(initialMeal.participantIds);
      setIngredientRows(
        initialMeal.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          unit: ing.unit,
          measurementMethod: ing.measurementMethod,
          perPersonAmount: ing.perPersonAmount || 0,
          percentageAmount: ing.percentageAmount || 100,
          baseAmount: ing.baseAmount || 1000
        }))
      );
      setExtraPurchases(initialMeal.extraPurchases || []);
    } else {
      // Default to today and all active members selected
      setDateJalali(defaultDate || today.formatted);
      setTitle('');
      setNotes('');
      setSelectedRecipeId('');
      const activeIds = members.filter((m) => m.isActive).map((m) => m.id);
      setSelectedParticipantIds(activeIds);
      setIngredientRows([]);
      setExtraPurchases([]);
    }
    setErrorMessage('');
  }, [initialMeal, defaultDate, isOpen]);

  // Handle recipe selection
  const handleSelectRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    if (!recipeId) return;

    const rec = recipes.find((r) => r.id === recipeId);
    if (!rec) return;

    if (!title) {
      setTitle(rec.name);
    }

    const rows: FormIngredientRow[] = rec.ingredients.map((item) => {
      const inv = ingredients.find((i) => i.id === item.ingredientId);
      return {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        unit: inv ? inv.baseUnit : item.unit,
        measurementMethod: item.defaultMethod || 'per_person',
        perPersonAmount: item.defaultPerPerson || 50,
        percentageAmount: 100,
        baseAmount: item.baseAmount || 1000
      };
    });
    setIngredientRows(rows);
  };

  // Participant toggles
  const toggleParticipant = (memberId: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAllParticipants = () => {
    const allActiveIds = members.filter((m) => m.isActive).map((m) => m.id);
    if (selectedParticipantIds.length === allActiveIds.length) {
      setSelectedParticipantIds([]);
    } else {
      setSelectedParticipantIds(allActiveIds);
    }
  };

  // Add an ingredient row
  const handleAddIngredientRow = (ingredientId: string) => {
    if (!ingredientId) return;
    const inv = ingredients.find((i) => i.id === ingredientId);
    if (!inv) return;

    // Check if already in list
    if (ingredientRows.some((r) => r.ingredientId === ingredientId)) {
      return;
    }

    setIngredientRows((prev) => [
      ...prev,
      {
        ingredientId: inv.id,
        ingredientName: inv.name,
        unit: inv.baseUnit,
        measurementMethod: 'per_person',
        perPersonAmount: 50,
        percentageAmount: 100,
        baseAmount: 1000
      }
    ]);
  };

  // Remove an ingredient row
  const handleRemoveIngredientRow = (index: number) => {
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Add extra purchase
  const handleAddExtraPurchase = () => {
    const rawCost = parseInt(newExtraCost.replace(/[^0-9]/g, ''), 10);
    if (!newExtraName.trim() || isNaN(rawCost) || rawCost <= 0 || !newExtraBuyer) {
      alert('لطفاً نام کالا، مبلغ معتبر و خریدار را انتخاب نمایید.');
      return;
    }

    const baseCost = toBaseAmount(rawCost, currency);
    const buyer = members.find((m) => m.id === newExtraBuyer);
    const newEp: ExtraPurchaseItem = {
      id: `ep-${Date.now()}`,
      name: newExtraName.trim(),
      quantity: 1,
      unit: 'piece',
      totalCost: baseCost,
      buyerMemberId: newExtraBuyer,
      buyerMemberName: buyer ? buyer.name : 'نامشخص',
      mode: newExtraMode
    };

    setExtraPurchases((prev) => [...prev, newEp]);
    setNewExtraName('');
    setNewExtraCost('');
    setNewExtraBuyer('');
  };

  const handleRemoveExtraPurchase = (id: string) => {
    setExtraPurchases((prev) => prev.filter((ep) => ep.id !== id));
  };

  // Compute live calculations
  const participants = useMemo(
    () => members.filter((m) => selectedParticipantIds.includes(m.id)),
    [members, selectedParticipantIds]
  );

  const calculatedResult = useMemo(() => {
    const preparedIngredients = ingredientRows.map((row) => {
      const inv = ingredients.find((i) => i.id === row.ingredientId);
      const unitCost = inv ? inv.averageUnitCost : 0;
      return {
        ...row,
        unitCost
      };
    });

    return MealCostCalculator.calculateMealCost(
      preparedIngredients,
      extraPurchases,
      participants
    );
  }, [ingredientRows, extraPurchases, participants, ingredients]);

  // Check stock availability
  const stockCheck = useMemo(() => {
    // When editing, adjust for previous consumption if applicable
    let availableInventory = ingredients;
    if (initialMeal) {
      availableInventory = InventoryTransactionManager.reverseMealConsumption(
        availableInventory,
        initialMeal.ingredients
      );
    }
    return InventoryTransactionManager.checkStockAvailability(
      calculatedResult.ingredients,
      availableInventory,
      allowNegativeInventory
    );
  }, [calculatedResult.ingredients, ingredients, initialMeal, allowNegativeInventory]);

  // Save submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('لطفاً عنوان یا نام غذا را وارد نمایید.');
      return;
    }

    if (selectedParticipantIds.length === 0) {
      setErrorMessage('حداقل یک نفر باید به عنوان حاضر در وعده انتخاب شود.');
      return;
    }

    if (!allowNegativeInventory && stockCheck.hasShortage) {
      setErrorMessage(
        'موجودی برخی مواد اولیه در انبار کافی نیست. لطفاً کسری را از طریق خرید اضافه ثبت کنید یا مقدار مصرف را کاهش دهید.'
      );
      return;
    }

    const mealToSave: Meal = {
      id: initialMeal ? initialMeal.id : `meal-${Date.now()}`,
      dateJalali,
      dateIso: jalaliToIso(dateJalali),
      title: title.trim(),
      notes: notes.trim(),
      recipeId: selectedRecipeId || undefined,
      participantIds: selectedParticipantIds,
      participantSnapshots: calculatedResult.participantSnapshots,
      ingredients: calculatedResult.ingredients,
      extraPurchases: calculatedResult.extraPurchases,
      totalInventoryCost: calculatedResult.totalInventoryCost,
      totalExtraCost: calculatedResult.totalExtraCost,
      totalCost: calculatedResult.totalCost,
      costPerParticipant: calculatedResult.costPerParticipant,
      createdAt: initialMeal ? initialMeal.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(mealToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialMeal ? 'ویرایش وعده ناهار' : 'ثبت وعده ناهار جدید'}
              </h3>
              <p className="text-xs text-slate-500">
                تاریخ، مواد اولیه، خریدهای اضافه و اعضای حاضر را مشخص کنید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Jalali Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ شمسی
              </label>
              <input
                type="text"
                value={dateJalali}
                onChange={(e) => setDateJalali(e.target.value)}
                placeholder="1405/07/05"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Recipe Quick Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                انتخاب از قالب غذا (Recipe)
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => handleSelectRecipe(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- بدون قالب (وارد کردن دستی) --</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Food Name / Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام غذا / عنوان ناهار *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: خورشت قیمه"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات اختیاری
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثلاً: ناهار روز شنبه، مهمان، یا شرایط خاص..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Section 2: Participants Multi-Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  اعضای حاضر در این وعده ({toPersianDigits(selectedParticipantIds.length)} نفر انتخاب شده‌اند)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleSelectAllParticipants}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                {selectedParticipantIds.length === members.filter((m) => m.isActive).length
                  ? 'لغو انتخاب همه'
                  : 'انتخاب همه اعضای فعال'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {members.map((m) => {
                const isSelected = selectedParticipantIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParticipant(m.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded-sm font-bold ml-1 ${
                        m.type === 'primary'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                      }`}
                    >
                      {m.type === 'primary' ? 'اصلی' : 'فرعی'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Ingredients List & Measurement Methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  مواد اولیه مصرفی از انبار
                </h4>
              </div>

              {/* Add Ingredient Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    handleAddIngredientRow(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="" disabled>
                    + افزودن ماده اولیه از انبار...
                  </option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (موجودی: {toPersianDigits(ing.currentStock)} {ing.baseUnit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ingredientRows.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                هیچ ماده اولیه‌ای از انبار اضافه نشده است. می‌توانید یک قالب غذا انتخاب کنید یا از منوی بالا ماده اضافه کنید.
              </div>
            ) : (
              <div className="space-y-2.5">
                {ingredientRows.map((row, index) => {
                  const inv = ingredients.find((i) => i.id === row.ingredientId);
                  const computedItem = calculatedResult.ingredients[index];
                  const shortage = stockCheck.shortages.find((s) => s.ingredientId === row.ingredientId);

                  return (
                    <div
                      key={row.ingredientId}
                      className={`p-3 rounded-xl border transition-colors ${
                        shortage
                          ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {row.ingredientName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            موجودی انبار: {toPersianDigits(inv ? inv.currentStock : 0)} {row.unit}
                          </span>
                        </div>

                        {/* Measurement Method Switcher */}
                        <div className="flex items-center gap-2 self-stretch sm:self-auto">
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...ingredientRows];
                                updated[index].measurementMethod = 'per_person';
                                setIngredientRows(updated);
                              }}
                              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                row.measurementMethod === 'per_person'
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                  : 'text-slate-500'
                              }`}
                            >
                              بر اساس نفر
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...ingredientRows];
                                updated[index].measurementMethod = 'percentage';
                                setIngredientRows(updated);
                              }}
                              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                row.measurementMethod === 'percentage'
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                  : 'text-slate-500'
                              }`}
                            >
                              بر اساس درصد
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientRow(index)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف این ماده"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inputs row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 items-center text-xs">
                        {row.measurementMethod === 'per_person' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 whitespace-nowrap">مقدار به ازای هر نفر:</span>
                            <input
                              type="number"
                              min="0"
                              value={row.perPersonAmount || ''}
                              onChange={(e) => {
                                const updated = [...ingredientRows];
                                updated[index].perPersonAmount = parseFloat(e.target.value) || 0;
                                setIngredientRows(updated);
                              }}
                              className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
                            />
                            <span className="text-slate-400">{row.unit}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 whitespace-nowrap">درصد مصرف:</span>
                            <input
                              type="number"
                              min="0"
                              max="300"
                              value={row.percentageAmount || ''}
                              onChange={(e) => {
                                const updated = [...ingredientRows];
                                updated[index].percentageAmount = parseFloat(e.target.value) || 0;
                                setIngredientRows(updated);
                              }}
                              className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
                            />
                            <span className="text-slate-400">% از {toPersianDigits(row.baseAmount)} {row.unit}</span>
                          </div>
                        )}

                        <div className="text-slate-600 dark:text-slate-400">
                          مصرف نهایی: <strong className="text-slate-900 dark:text-white font-bold">{toPersianDigits(computedItem ? computedItem.finalQuantity : 0)} {row.unit}</strong>
                        </div>

                        <div className="text-left font-bold text-emerald-600 dark:text-emerald-400">
                          هزینه: {formatCurrency(computedItem ? computedItem.totalCost : 0, currency)}
                        </div>
                      </div>

                      {/* Shortage alert */}
                      {shortage && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
                          <span className="font-bold">
                            ⚠ کسری موجودی: {toPersianDigits(shortage.shortage)} {row.unit} کمبود وجود دارد!
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewExtraName(`کسری ${row.ingredientName}`);
                              setNewExtraMode('direct_consumption');
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold cursor-pointer hover:bg-rose-700 transition-colors"
                          >
                            ثبت خرید اضافه
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Extra Purchases for Meal (خریدهای اضافه) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                خریدهای اضافه و خارج از انبار برای این وعده
              </h4>
            </div>

            {/* List of current extra purchases */}
            {extraPurchases.length > 0 && (
              <div className="space-y-2">
                {extraPurchases.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200 block">
                        {ep.name}
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400">
                        خریدار و پرداخت‌کننده: <strong>{ep.buyerMemberName}</strong> |{' '}
                        {ep.mode === 'direct_consumption' ? 'مصرف مستقیم در همین وعده' : 'اضافه شدن به انبار'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-900 dark:text-amber-200">
                        {formatCurrency(ep.totalCost, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraPurchase(ep.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form to add new extra purchase */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <input
                type="text"
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                placeholder="عنوان خرید (مثلاً: ماست، سالاد، گوشت اضافه)"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <input
                type="number"
                value={newExtraCost}
                onChange={(e) => setNewExtraCost(e.target.value)}
                placeholder={`مبلغ کل (${currency})`}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <select
                value={newExtraBuyer}
                onChange={(e) => setNewExtraBuyer(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">-- انتخاب خریدار --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddExtraPurchase}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن خرید اضافه</span>
              </button>
            </div>
          </div>

          {/* Section 5: Real-time Financial Breakdown */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>محاسبه خودکار مالی و تقسیم سهم (دنگ)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">ارزش مواد انبار</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(calculatedResult.totalInventoryCost, currency)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">خریدهای اضافه</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(calculatedResult.totalExtraCost, currency)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">هزینه کل وعده</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(calculatedResult.totalCost, currency)}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">سهم هر نفر ({toPersianDigits(participants.length)} نفر)</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(calculatedResult.costPerParticipant, currency)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ثبت نهایی و کسر از انبار</span>
          </button>
        </div>
      </div>
    </div>
  );
};
