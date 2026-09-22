import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Utensils,
  X,
  Package,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Recipe, Ingredient, RecipeIngredientItem, UnitType } from '../types';
import { toPersianDigits, UNIT_LABELS } from '../utils/jalali';

interface RecipesViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onSaveRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onCookRecipe: (recipeId: string) => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  ingredients,
  onSaveRecipe,
  onDeleteRecipe,
  onCookRecipe
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [recipeItems, setRecipeItems] = useState<RecipeIngredientItem[]>([]);

  const openAddModal = () => {
    setEditingRecipe(null);
    setFormName('');
    setFormDesc('');
    setRecipeItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: Recipe) => {
    setEditingRecipe(rec);
    setFormName(rec.name);
    setFormDesc(rec.description || '');
    setRecipeItems([...rec.ingredients]);
    setIsModalOpen(true);
  };

  const handleAddIngredientToRecipe = (ingredientId: string) => {
    if (!ingredientId) return;
    const inv = ingredients.find((i) => i.id === ingredientId);
    if (!inv) return;

    if (recipeItems.some((item) => item.ingredientId === ingredientId)) {
      return;
    }

    setRecipeItems((prev) => [
      ...prev,
      {
        ingredientId: inv.id,
        ingredientName: inv.name,
        unit: inv.baseUnit,
        defaultMethod: 'per_person',
        defaultPerPerson: 50,
        baseAmount: 1000
      }
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('لطفاً نام غذا را وارد کنید.');
      return;
    }

    const recToSave: Recipe = {
      id: editingRecipe ? editingRecipe.id : `rec-${Date.now()}`,
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      ingredients: recipeItems,
      updatedAt: new Date().toISOString()
    };

    onSaveRecipe(recToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              قالب‌های آماده غذا (Recipes)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تعریف ترکیب مواد پیش‌فرض برای ثبت سریع و تک‌کلیک وعده‌های ناهار
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف قالب غذای جدید</span>
        </button>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((rec) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {rec.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {toPersianDigits(rec.ingredients.length)} قلم ماده اولیه
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(rec)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف قالب "${rec.name}" مطمئن هستید؟`)) {
                        onDeleteRecipe(rec.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {rec.description && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {rec.description}
                </p>
              )}

              {/* Ingredients preview chips */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                {rec.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-0.5"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {ing.ingredientName}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {toPersianDigits(ing.defaultPerPerson || 0)} {UNIT_LABELS[ing.unit] || ing.unit} به ازای هر نفر
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onCookRecipe(rec.id)}
                className="w-full py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>ثبت وعده ناهار با این غذا</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add / Edit Recipe */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRecipe ? 'ویرایش قالب غذا' : 'تعریف قالب غذای جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام غذا *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: قورمه سبزی، چلو کباب، عدس پلو..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و دستور پخت
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="توضیحات اختیاری..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Ingredients in recipe */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    مواد اولیه تشکیل‌دهنده:
                  </span>
                  <select
                    onChange={(e) => {
                      handleAddIngredientToRecipe(e.target.value);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] cursor-pointer"
                  >
                    <option value="" disabled>
                      + افزودن ماده اولیه...
                    </option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.baseUnit})
                      </option>
                    ))}
                  </select>
                </div>

                {recipeItems.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    هنوز ماده اولیه‌ای به این غذا افزوده نشده است.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recipeItems.map((item, idx) => (
                      <div
                        key={item.ingredientId}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.ingredientName}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">مقدار به ازای هر نفر:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.defaultPerPerson || ''}
                            onChange={(e) => {
                              const updated = [...recipeItems];
                              updated[idx].defaultPerPerson = parseFloat(e.target.value) || 0;
                              setRecipeItems(updated);
                            }}
                            className="w-16 px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
                          />
                          <span className="text-slate-400 text-[11px]">{item.unit}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  ذخیره قالب غذا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
